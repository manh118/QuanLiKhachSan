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
  ]
  },{
    timestamps: true
  })


module.exports = mongoose.model('RoomType', RoomType)