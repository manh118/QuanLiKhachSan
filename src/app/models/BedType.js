const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const BedType = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },  
  },{
    timestamps: true
  })


module.exports = mongoose.model('BedType', BedType)