const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const BedType = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String },              // Kích thước giường: "180cm x 200cm", "160cm x 200cm"
    description: { type: String },       // Mô tả chi tiết: "Giường King size đệm Simmons cao cấp"
    quantity: { type: Number, default: 1 }, // Số giường (1 giường đôi vs 2 giường đơn)
  },{
    timestamps: true
  })


module.exports = mongoose.model('BedType', BedType)