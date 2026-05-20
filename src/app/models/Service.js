const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const Service = new Schema({
    idService: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },  
    unit: { type: String, required: true },
    description: { type: String },                     // Mô tả chi tiết dịch vụ
    category: {                                        // Phân loại dịch vụ
        type: String,
        enum: ['Ăn uống', 'Đưa đón', 'Giặt ủi', 'Spa & Wellness', 'Tiện ích', 'Giải trí', 'Khác'],
        default: 'Khác'
    },
    operatingHours: { type: String },                  // Giờ hoạt động: "06:00 - 22:00"
    location: { type: String },                        // Vị trí: "Tầng 1 - Sảnh chính", "Tầng Thượng"
    isActive: {
        type: Boolean,
        default: true
    }
  },{
    timestamps: true
  })


module.exports = mongoose.model('Service', Service)