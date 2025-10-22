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
        type: Schema.Types.ObjectId, // Liên kết tới _id của User
        ref: 'User', // Tên Model 'User'
        default: null // Cho phép khách vãng lai (không đăng nhập) đặt phòng
    },
    depositAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    bookingStatus: { 
        type: String,
        enum: ['Pending Deposit', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled'],
        default: 'Pending Deposit' // Mặc định là chờ xác nhận cọc
    },
    source: {
        type: String,
        enum: ['website', 'manual'], // 'website' (khách tự đặt), 'manual' (lễ tân nhập tay)
        default: 'website' // Mặc định là 'website'
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
