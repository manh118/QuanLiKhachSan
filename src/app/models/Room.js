const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const Room = new Schema({
    roomNumber: { type: String, required: true },
    bedType: { type: mongoose.Schema.Types.ObjectId, ref: 'BedType', required: true },
    roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
    status: {
        type: String,
        enum: ['Trống', 'Đã đặt', 'Đang ở', 'Dọn dẹp'],
        default: 'Trống'
    },
    img: { type: String },
    description: { type: String },
    area: { type: String },                          // Diện tích: "35m²"
    floor: { type: Number },                         // Tầng: 3, 5, 7
    view: { type: String },                          // Hướng nhìn: "Thành phố", "Hồ", "Sân vườn"
    hasBalcony: { type: Boolean, default: false },    // Có ban công không
    isSmokingAllowed: { type: Boolean, default: false }, // Cho phép hút thuốc
    isConnecting: { type: Boolean, default: false },  // Phòng thông nhau (connecting rooms)
    maxExtraBed: { type: Number, default: 0 },        // Số giường phụ tối đa có thể kê thêm

  },{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  })

Room.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' })

module.exports = mongoose.model('Room', Room)