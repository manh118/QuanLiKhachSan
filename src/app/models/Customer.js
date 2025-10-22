const mongoose = require('mongoose');

const Schema = mongoose.Schema

const Customer = new Schema({
  fullName: { type: String, required: true },
  gender: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },  
  phone: { type: Number, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  CMND: { type: Number, required: true },
  nationality: { type: String, required: true },
}, {
  timestamps: true
});


module.exports = mongoose.model('Customer', Customer)