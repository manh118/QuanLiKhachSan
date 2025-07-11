const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
var mongooseDelete = require('mongoose-delete');

mongoose.plugin(slug);

const Schema = mongoose.Schema

const Room = new Schema({
    roomNumber: { type: String, required: true },
    bedType: { type: mongoose.Schema.Types.ObjectId, ref: 'BedType',required: true },                            // Ví dụ: "VIP", "Standard"
    roomType: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType',  required: true},    // available, booked, maintenance
    status: { type: String,  enum: ['trống', 'đã đặt'], default: 'Trống' },
    img: { type: String },
    description: {type: String},
    area: {type: String},
    
  },{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  })

Room.plugin(mongooseDelete, { deletedAt: true, overrideMethods: 'all' })

module.exports = mongoose.model('Room', Room)