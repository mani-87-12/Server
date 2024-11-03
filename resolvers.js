const User = require('./model/userSchema');
const mongoose = require('mongoose')

const resolvers = {
  Query: {
    getUsers: async () => {
      return await User.find();
    },
    getUser: async (_, { username, password }) => {
      try {
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
          throw new Error('Invalid username or password');
        }
        return user;
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },
  Mutation: {
    createUser: async (_, { username, email, password }) => {
      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          throw new Error('User already exists');
        }
        const newUser = new User({ username, email, password });
        return await newUser.save();
      } catch (err) {
        throw new Error(err.message);
      }
    },
    changePass: async (_, { username, password }) => {
      try {
        const user = await User.findOne({ username });
        if (user) {
          user.password = password; // Fixed password update
          return await user.save();
        } else {
          throw new Error('User not found');
        }
      } catch (err) {
        throw new Error(err.message);
      }
    },
    // Example resolver
    async updateUserImage(_, { username, imageUrl }) {
        // Look up the user by username or uid
        // console.log('Updating user image with:', { username, imageUrl, uid });
        // const userId = new mongoose.Types.ObjectId(uid);
        // console.log(userId)
            // Look up the user by _id
        //const user = await User.findOne({ username });
        const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        console.log(user)
        if (!user) {
            throw new Error('User not found');
        }
        user.imageUrl = imageUrl; // Update the imageUrl field
        await user.save(); // Save the user
        return user; // Return updated user
    }

    },
};

module.exports = resolvers;
