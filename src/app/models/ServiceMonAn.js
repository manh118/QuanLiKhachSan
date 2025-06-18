const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const ServiceMonAn = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },  
    price: { type: Number, required: true },  
    img: { type: String, required: true }, 
    type : { type: String, required: true }, 
  },{
    timestamps: true
  })


module.exports = mongoose.model('ServiceMonAn', ServiceMonAn)