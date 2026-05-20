const mongoose = require('mongoose')

const Schema = mongoose.Schema

const RoomType = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },              // Giá cơ bản/đêm (ngày thường)
    weekendMultiplier: { type: Number, default: 1.2 },    // Hệ số cuối tuần (Thứ 6-CN). 1.2 = tăng 20%
    holidayMultiplier: { type: Number, default: 1.5 },    // Hệ số ngày lễ/Tết. 1.5 = tăng 50%
    peakSeasonMultiplier: { type: Number, default: 1.3 }, // Hệ số mùa cao điểm (hè, lễ kéo dài). 1.3 = tăng 30%
    description: { type: String, required: true },
    shortDescription: { type: String },                // Mô tả ngắn 1 dòng cho chatbot/SEO
    img: { type: String },
    utilities: [
    {
      name: { type: String, required: true },       
      icon: { type: String, required: true },       
      note: { type: String }                        
    }
  ],
  maxAdults: { type: Number, required: true, default: 2 },
  maxOccupancy: { type: Number, required: true, default: 2 },
  // Chính sách giường phụ
  extraBedAllowed: { type: Boolean, default: false },  // Có cho phép kê giường phụ không
  extraBedPrice: { type: Number, default: 0 },         // Phí kê giường phụ / đêm
  // Chính sách phụ thu
  extraAdultPrice: { type: Number, default: 0 },       // Phụ thu mỗi người lớn vượt tiêu chuẩn / đêm
  childFreeAge: { type: Number, default: 6 },          // Trẻ em dưới X tuổi được miễn phí
  childExtraPrice: { type: Number, default: 0 },       // Phụ thu trẻ em trên X tuổi / đêm
  // Bao gồm
  includesBreakfast: { type: Boolean, default: false }, // Giá phòng đã bao gồm bữa sáng chưa
  },{
    timestamps: true
  })


module.exports = mongoose.model('RoomType', RoomType)