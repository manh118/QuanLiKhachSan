const mongoose = require('mongoose');

const Schema = mongoose.Schema

const Position = new Schema({
  name: {type : String, required: true},
  description: {type : String, required: true}
  
}, {
  timestamps: true
});


module.exports = mongoose.model('Position', Position)