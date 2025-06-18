const mongoose = require('mongoose');

const Schema = mongoose.Schema

const Employee = new Schema({
  maNhanVien: { type: String, required: true },
  hoTen: { type: String, required: true },
  chucVu: { type: mongoose.Schema.Types.ObjectId, ref: 'Position',required: true },  
  diaChi: { type: String, required: true },
  email: { type: String, required: true },
  gioiTinh: { type: String, required: true },
  luongCoBan: { type: Number, required: true },
  ngaySinh: Date,
  soDienThoai: { type: Number, required: true },

}, {
  timestamps: true
});


module.exports = mongoose.model('Employee', Employee)