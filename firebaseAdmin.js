// firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./socialmedia'); // Path to your service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
