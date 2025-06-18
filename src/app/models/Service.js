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
  },{
    timestamps: true
  })


module.exports = mongoose.model('Service', Service)