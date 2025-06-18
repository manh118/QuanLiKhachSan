const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const RoomType = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },  
    description: { type: String, required: true },
    img: {type: String},
    utilities: [
    {
      name: { type: String, required: true },       // Ví dụ: "Điều hòa"
      icon: { type: String, required: true },       // Ví dụ: "fa-solid fa-snowflake" (FontAwesome class)
      note: { type: String }                        // Tùy chọn mô tả chi tiết hơn
    }
  ]
  },{
    timestamps: true
  })


module.exports = mongoose.model('RoomType', RoomType)