const Room = require('../models/Room')
const BedType = require('../models/BedType')
const RoomType = require('../models/RoomType')
const Service = require('../models/Service')
const Employee = require('../models/Employee')
const Position = require('../models/Position')
const Booking = require('../models/Booking')


class ManageController {
  //[Get] home
  index(req, res, next) {
    res.render('manage/quanli', {
      username: req.session.user.username,
      isManage: true,
    })
  }

  logout(req, res, next) {
    req.session.destroy(() => {
      res.redirect('/login')
    })
  }

  dsPhong(req, res, next) {
    // const searchQuery = req.query.q

    // let query = {}
    // if (searchQuery) {
    //   query.roomNumber = { $regex: searchQuery, $options: 'i' } // Tìm mờ, không phân biệt hoa thường
    // }

    const selectedRoomType = req.query.roomType
    const selectedBedType = req.query.bedType

    let query = {}
    if (selectedRoomType) {
      query.roomType = selectedRoomType
    }
    if (selectedBedType) {
      query.bedType = selectedBedType
    }

    Promise.all([
      Room.find(query).populate('roomType').populate('bedType').lean(),
      RoomType.find().lean(),
      BedType.find().lean(),
    ])
      .then(([Rooms, roomTypes, bedTypes]) => {
        res.render('manage/quan_li_phong', {
          Rooms,
          roomTypes,
          bedTypes,
          selectedRoomType,
          selectedBedType,
        })
      })
      .catch(next)
  }

  dsDichVu(req, res, next) {
     const selected = req.query.khoangGia;
     let query = {};

    if (selected === 'lt200') {
      query.price = { $lt: 100000 };
    } else if (selected === '200to400') {
      query.price = { $gte: 100000, $lte: 200000 };
    } else if (selected === 'gt400') {
      query.price = { $gt: 200000 };
    }

    Service.find(query)
      .lean()
      .then((Services) => {
        res.render('manage/quan_li_dichvu', { Services, selected })
      })
      .catch(next)
  }

  dsHangPhong(req, res, next) {
    RoomType.find({})
      .lean()
      .then((Roomtypes) => {
        res.render('manage/quan_li_hangphong', { Roomtypes })
      })
      .catch(next)
  }

  dsNhanVien(req, res, next) {
    Employee.find({})
      .populate('chucVu', 'name')
      .lean()
      .then((Employees) => {
        res.render('manage/quan_li_nhanvien', { Employees })
      })
      .catch(next)
  }

  dsPhieuThue(req, res, next) {

    const searchName = req.query.q || '';
  const searchPhone = req.query.q1 || '';
  let query = {};

  if (searchName && searchPhone) {
    query = {
      $and: [
        { 'customer.fullName': { $regex: searchName, $options: 'i' } },
        { 'customer.phone': { $regex: searchPhone, $options: 'i' } },
      ]
    };
  } else if (searchName) {
    query = {
      'customer.fullName': { $regex: searchName, $options: 'i' }
    };
  } else if (searchPhone) {
    query = {
      'customer.phone': { $regex: searchPhone, $options: 'i' }
    };
  }

    Booking.find(query)
      .populate('services.service')
      .lean()
      .then((Bookings) => {
        res.render('manage/quan_li_phieuthue', { Bookings })
      })
      .catch(next)
  }
}

module.exports = new ManageController()
