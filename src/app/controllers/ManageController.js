const Room = require('../models/Room')
const BedType = require('../models/BedType')
const RoomType = require('../models/RoomType')
const Service = require('../models/Service')
const Employee = require('../models/Employee')
const Position = require('../models/Position')
const Booking = require('../models/Booking')
const Bill = require('../models/Bill')
const User = require('../models/User')



class ManageController {
  //[Get] home
  index(req, res, next) {

   Promise.all([
        Room.find().populate('roomType').populate('bedType').lean(),
        // Chỉ lấy các booking đang thực sự chiếm phòng (đã xác nhận hoặc đang ở)
        Booking.find({ 
            bookingStatus: { $in: ['Confirmed', 'Checked In'] } 
        }).lean()
    ])
    .then(([rooms, activeBookings]) => { // Đổi tên biến cho rõ ràng
        const roomsWithBooking = rooms.map(room => {
            // Bây giờ, mảng activeBookings chỉ chứa các phiếu thuê đang hoạt động
            const booking = activeBookings.find(b => b.room.toString() === room._id.toString());
            return {
                ...room,
                booking, // Nếu không tìm thấy, booking sẽ là 'undefined'
                price: (room.bedType?.price || 0) + (room.roomType?.price || 0) // Sửa thành dấu + để tính tổng giá
            };
        });

        res.render('manage/quanli', {
            isHome: true,
            Rooms: roomsWithBooking
        });
    })
    .catch(next);
    
  }

  logout(req, res, next) {
    req.session.destroy(() => {
      res.redirect('/account/login')
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
        res.render('manage/quan_li_dichvu', { Services, selected, success: req.query.success === '1'  })
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
      .sort({ createdAt: -1 })
      .lean()
      .then((Bookings) => {
        res.render('manage/quan_li_phieuthue', {
           Bookings,
           searchQuery: searchName, 
          searchPhone: searchPhone 
          })
      })
      .catch(next)
  }

  dsHoaDon(req, res, next) {
    
    Bill.find()
      .lean()
      .then((bills) => {
        res.render('manage/quan_li_hoadon', { bills})
      })
      .catch(next)
  }

   async dsKhachHang(req, res, next) {
   try {
        const searchQuery = req.query.q || '';
        let query = { role: 'user' }; 
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },     
                { phone: { $regex: searchQuery, $options: 'i' } },    
                { fullName: { $regex: searchQuery, $options: 'i' } }  
            ];
        }
        const customers = await User.find(query).sort({ createdAt: -1 }).lean();

        res.render('manage/quan_li_khachhang', {
            Customers: customers,
            searchQuery: searchQuery // 
        });

    } catch (error) {
        next(error);
    }
  }


}

module.exports = new ManageController()
