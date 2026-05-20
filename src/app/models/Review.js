const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
    customerName: { type: String, required: true },
    customerEmail: { type: String },
    roomNumber: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    avatar: { type: String }, // initials-based, e.g. "T" for Trần
    isApproved: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
