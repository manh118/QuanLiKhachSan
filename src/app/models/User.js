const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// models/User.js
const User = new Schema({
    name: { type: String, index: true }, 
    phone: { type: String, required: true, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, index: true },
    password: { type: String }, // 
    role: { type: String, required: true, default: 'user' }, 

    fullName: { type: String }, // Tên đầy đủ
    dob: { type: Date }, 
    idCard: { type: String, sparse: true, unique: true },
    address: { type: String }
});

module.exports = mongoose.model('User', User);