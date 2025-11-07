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
    isActive: {
        type: Boolean,
        default: true // Mặc định là đang hoạt động khi mới tạo
    }
  },{
    timestamps: true
  })


module.exports = mongoose.model('Service', Service)