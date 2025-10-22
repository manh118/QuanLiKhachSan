const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const Bill = new Schema({
   idBill: { type: String, required: true, unique: true }, // Mã hóa đơn, nên là duy nhất
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' }, // **Rất quan trọng**: Liên kết tới phiếu thuê gốc

    customerName: { type: String, required: true },
    phone: { type: String, required: true }, // Nên dùng String để giữ số 0 ở đầu
    roomNumber: { type: String, required: true }, // Nên là String vì có thể có phòng A101
    
    checkIn: Date,
    checkOut: Date,

    totalAmount: { type: Number, required: true }, // **Tổng tiền gốc** của cả booking
    depositAmount: { type: Number, required: true }, // **Số tiền đã cọc**
    amountPaid: { type: Number, required: true }, // **Số tiền thanh toán lúc checkout** (chính là tiền còn lại)

    paymentDate: { type: Date, default: Date.now }, // Ngày thanh toán hóa đơn
}, {
    timestamps: true
  })


module.exports = mongoose.model('Bill', Bill)