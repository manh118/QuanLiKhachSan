const mongoose = require('mongoose');

const Schema = mongoose.Schema

const User = new Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },  
    role: { type: String, required: true }
  })


module.exports = mongoose.model('User', User)