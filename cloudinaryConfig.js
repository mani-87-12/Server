const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: 'dugnwghwp',
  api_key: '178692785747884',
  api_secret: 'YK06JjF3Z4OwtjTDI5AYKC0sDCA',
});

module.exports = cloudinary;

