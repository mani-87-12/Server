const { gql, ApolloServer } = require('apollo-server-express');
const express = require('express');
const request = require('supertest'); // Assuming you're using supertest
const cookieParser = require('cookie-parser');
const router = require('../router/userRouter'); // Assuming the path
const User = require('../model/userSchema'); // Assuming the path
const { generateJWT } = require('../jwt/jwt'); // Assuming the path

const app = express();
app.use(express.json()); 
app.use(cookieParser());
app.use('/', router);

const typeDefs = require('../schema'); // Assuming the path
const resolvers = require('../resolvers'); // Assuming the path
const server = new ApolloServer({ typeDefs, resolvers });

// Mock for Firebase Admin SDK
jest.mock('../firebaseAdmin', () => ({
  auth: jest.fn(() => {
    return {
      verifyIdToken: jest.fn(() => Promise.resolve({
        uid: 'test-uid',
        email: 'test@example.com'
      }))
    };
  })
}));

// Mock for User model methods if needed
jest.mock('../model/userSchema'); 

describe('User Router Tests', () => {
  let testUser;

  beforeAll(async () => {
    // Create a test user in the database (or mock this part)
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword' // You might need to hash this
    });
    await testUser.save();
  });

  afterAll(async () => {
    // Clean up the test user from the database
    await User.deleteOne({ username: 'testuser' });
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'newpassword'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.createUser).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // Check for cookies
  });

  it('should log in an existing user', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.getUser).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // Check for cookies
  });

  it('should handle invalid login credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'wrongpassword'
      });
  
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: 'Invalid credentials' }); // More specific error message check
  });
  

  it('should handle social login with valid token', async () => {
    const res = await request(app)
      .post('/social-login')
      .send({ token: 'some-mock-token' });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should handle social login with invalid token', async () => {
    // Mock Firebase Admin to throw an error
    jest.spyOn(admin.auth().verifyIdToken, 'mockImplementation')
      .mockRejectedValue(new Error('Invalid token'));

    const res = await request(app)
      .post('/social-login')
      .send({ token: 'invalid-token' });

    expect(res.statusCode).toBe(401);
    expect(res.text).toBe('Invalid token');
  });

  it('should log out a user', async () => {
    // First, log in to get a valid token
    const loginRes = await request(app)
      .post('/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });

    const token = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

    // Now, make the logout request with the token
    const res = await request(app)
      .post('/logout')
      .set('Cookie', `token=${token}`) 
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Logged Out');
  });
});
