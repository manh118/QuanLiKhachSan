const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const Bill = new Schema({
    idBill: { type: String, required: true },
    roomNumber: { type: Number, required: true },  
    name: { type: String, required: true },
    phone: { type: Number, required: true },  
    checkIn: Date,
    checkOut: Date,
    totalPrice: { type: Number, required: true },  
  },{
    timestamps: true
  })


module.exports = mongoose.model('Bill', Bill)