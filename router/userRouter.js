const { gql, ApolloServer } = require('apollo-server-express');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const router = express.Router();
const admin = require('../firebaseAdmin');
const User = require('../model/userSchema');
const typeDefs = require('../schema');
const resolvers = require('../resolvers');
const crypto = require('crypto');
const { generateJWT, verifyJWT } = require('../jwt/jwt');
const cloudinary = require('../cloudinaryConfig');
const multer = require('multer');

// Apollo Server setup
const server = new ApolloServer({ typeDefs, resolvers });
router.use(cookieParser());

// MongoDB connection URI (make sure this matches your MongoDB connection)
const mongoURI = 'mongodb+srv://gopalreddytheluckier:zS0pf0c0UJGVF77W@cluster0.mazavb5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Multer setup for temporary uploads
const upload = multer({ dest: 'uploads/' }); // Temporary storage before Cloudinary

// Register route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const { data, errors } = await server.executeOperation({
      query: gql`
        mutation {
          createUser(username: "${username}", email: "${email}", password: "${password}") {
            id
            username
          }
        }
      `,
    });

    if (errors) {
      return res.status(400).send(errors);
    }

    const token = generateJWT(data.createUser);
    res.cookie('token', token, { httpOnly: true, sameSite: 'Strict' });
    res.cookie('sessionID', crypto.randomBytes(64).toString('hex'), { httpOnly: true, sameSite: 'Strict' });

    res.status(200).send(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { data, errors } = await server.executeOperation({
      query: gql`
        query {
          getUser(username: "${username}", password: "${password}") {
            username
            imageUrl
          }
        }
      `,
    });

    if (errors || !data.getUser) {
      return res.status(404).send(errors || 'Invalid credentials');
    }

    const token = generateJWT(data.getUser);
    res.cookie('token', token, { httpOnly: true, sameSite: 'Strict' ,secure : false,  path: '/', });
    //res.status(200).send(data);
    res.status(200).send({
      success: true,
      token: token,
      user: {
        id: data.getUser.id,
        username: data.getUser.username,
        imageUrl : data.getUser.imageUrl,
      },
    });
  } catch (err) {
    res.status(500).send('Internal server error');
    console.error(err);
  }
});

// Social login route
router.post('/social-login', async (req, res) => {
  const { token } = req.body;
  console.log('Received token:', token); // Log the received token
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Decoded token:', decodedToken); // Log the decoded token for debugging

    const uid = decodedToken.uid;
    const email = decodedToken.email;

    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({
        uid,
        email,
        username: email.split('@')[0],
        password: '',
        imageUrl : null,
      });
      await user.save();
    }

    const jwtToken = generateJWT({ id: user._id, email: user.email });
    res.cookie('token', jwtToken, { httpOnly: true, secure: false, sameSite: 'Strict', path: '/' });

    res.status(200).send({
      success: true,
      token: jwtToken,
      user: {
        username: user.username,
        imageUrl : user.imageUrl,
      },
    });
  } catch (error) {
    console.error('Error verifying token:', error.code, error.message); // Log detailed error info
    res.status(401).send('Invalid token');
  }
});


// Logout route
router.post('/logout', verifyJWT, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out');
    }
    res.clearCookie('token', { httpOnly: true, sameSite: 'Strict' });
    res.clearCookie('sessionID', { httpOnly: true, sameSite: 'Strict' });
    res.status(200).send('Logged Out');
  });
});

// Route to upload image and update user profile
// Upload image route
router.post('/profile-upload-image', verifyJWT,async (req, res, next) => {
  upload.single('image')(req, res, (err) => {
      if (err) {
          return res.status(400).send({ error: 'Image upload error: ' + err.message });
      }
      next(); 
  });
}, async (req, res) => {
  try {
      const { uid } = req.user;
      const user = await User.findById(uid);
      if (!user) {
          return res.status(404).send('User not found');
      }

      if (!req.file) {
          return res.status(400).send('No image uploaded or file type not supported');
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'profile_images',
          public_id: `${user.username}-${Date.now()}`,
      });

      const { data, errors } = await server.executeOperation({
          query: gql`
              mutation {
                  updateUserImage(username: "${user.username}", imageUrl: "${result.secure_url}") {
                      imageUrl
                  }
              }
          `,
      });

      if (!data || errors) {
          return res.status(400).send(errors || 'Failed to update user image');
      }

      res.status(200).send({
          message: 'Image uploaded and profile updated successfully',
          imageUrl: result.secure_url,
      });
  } catch (error) {
      res.status(500).send('Error: ' + error.message);
  }
});

  

// Route to get image by filename
router.get('/profileimage', verifyJWT, async (req, res) => {
    try {
        // Assuming the user ID is stored in the JWT payload
        const { username } = req.user; // Extract uid from the verified JWT

        // Look up the user by uid
        const user = await User.findOne({ username });
        if (!user || !user.imageUrl) {
            return res.status(404).send('User or image not found');
        }

        // Optionally fetch additional info from Cloudinary if needed
        const publicId = `profile_images/${user.imageUrl.split('/').pop().split('.')[0]}`; // Extract public ID from URL
        const result = await cloudinary.api.resource(publicId);

        if (!result) {
            return res.status(404).send('Image not found in Cloudinary');
        }

        res.status(200).send({
            message: 'Image retrieved successfully',
            url: result.secure_url, // URL of the image
        });
        console.log(result.secure_url)
    } catch (error) {
        res.status(500).send('Error retrieving image');
        console.error(error);
    }
});

  
  // Route to delete an image by filename
router.delete('/profileimage', verifyJWT, async (req, res) => {
    try {
        // Find the user by UID from the verified token
        const {uid} = req.user
        const user = await User.findById(uid);
        console.log("UID : ", user)
        // Check if the user exists and has an imageUrl
        if (!user || !user.imageUrl) {
            return res.status(404).send('User or profile image not found');
        }
        // Extract the public ID from Cloudinary URL
         const publicId = user.imageUrl.split('/').slice(-1)[0].split('.')[0];
        // console.log('Extracted public ID:', publicId);

        // Attempt to delete the image from Cloudinary
        // const result = await cloudinary.uploader.destroy(publicId);
        // console.log('Cloudinary delete response:', result);

        // Check if the deletion was successful
      //   if (result.result !== 'ok') {
      //     console.error('Cloudinary Deletion Error:', result);
      //     return res.status(500).send(`Failed to delete image from Cloudinary: ${result.result}`);
      // }
        // Remove the image URL from the user's document in MongoDB
        user.imageUrl = null; // Clear the image URL
        await user.save(); // Save the updated user document

        res.status(200).send('Image URL deleted successfully');
    } catch (error) {
        res.status(500).send('Error deleting image URL');
        console.error(error);
    }
});

module.exports = router;
