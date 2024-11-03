const mongoose = require('mongoose')

const schema = mongoose.Schema({
    username: {
      type: String,
      required: false, // Make it optional if needed
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    uid: {
      type: String,
      required: false,
  },
    password: {
      type: String,
      required: false, // Make it optional if not required for social logins
    },
    imageUrl: { type: String },
  });
  

const userSchema = mongoose.Schema(schema)

module.exports = mongoose.model('User', userSchema)