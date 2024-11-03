// firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./socialmedia-5d2e5-firebase-adminsdk-oma63-d9f05155ed.json'); // Path to your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
