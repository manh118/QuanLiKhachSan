const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String, required: true }, 
  checkInDate: Date,
  checkOutDate: Date,
  soNgay: Number,
  nguoiLon: Number,
  treEm: Number,
  roomPrice: Number,
  totalRoomCost: Number,
  customer: {
    fullName: String,
    phone: String,
    email: String,
  },
  services: [
    {
      service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      quantity: Number,
      price: Number
    }
  ],
  totalServiceCost: Number,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
