const mongoose = require('mongoose')

const Schema = mongoose.Schema

const RoomType = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },  
    description: { type: String, required: true },
    img: {type: String},
    utilities: [
    {
      name: { type: String, required: true },       
      icon: { type: String, required: true },       
      note: { type: String }                        
    }
  ],
  maxAdults: { type: Number, required: true, default: 2 }, // Số người lớn tối đa cơ bản
    maxOccupancy: { type: Number, required: true, default: 2 },
  },{
    timestamps: true
  })


module.exports = mongoose.model('RoomType', RoomType)