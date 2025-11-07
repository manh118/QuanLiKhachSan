const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
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
  createdAt: { type: Date, default: Date.now },
  userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        default: null // Cho phép khách vãng lai (không đăng nhập) đặt phòng
    },
    depositAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    bookingStatus: { 
        type: String,
        enum: ['Pending Deposit', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled'],
        default: 'Pending Deposit' 
    },
    source: {
        type: String,
        enum: ['website', 'manual'], 
        default: 'website' 
    },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    extraAdultSurcharge: { type: Number, default: 0 },
    lateCheckOutFee: { type: Number, default: 0 },
    actualCheckInTime: { type: Date }, // Thời gian check-in thực tế
    actualCheckOutTime: { type: Date } // Thời gian check-out thực tế
});

module.exports = mongoose.model('Booking', BookingSchema);
