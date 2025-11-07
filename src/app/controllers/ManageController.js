const Room = require('../models/Room')
const BedType = require('../models/BedType')
const RoomType = require('../models/RoomType')
const Service = require('../models/Service')
const Employee = require('../models/Employee')
const Position = require('../models/Position')
const Booking = require('../models/Booking')
const Bill = require('../models/Bill')
const User = require('../models/User')
const Discount = require('../models/Discount');
const moment = require('moment');



class ManageController {
  //[Get] home
  // index(req, res, next) {

  //  Promise.all([
  //       Room.find().populate('roomType').populate('bedType').lean(),
  //       // Chỉ lấy các booking đang thực sự chiếm phòng (đã xác nhận hoặc đang ở)
  //       Booking.find({ 
  //           bookingStatus: { $in: ['Confirmed', 'Checked In'] } 
  //       }).lean()
  //   ])
  //   .then(([rooms, activeBookings]) => { // Đổi tên biến cho rõ ràng
  //       const roomsWithBooking = rooms.map(room => {
  //           // Bây giờ, mảng activeBookings chỉ chứa các phiếu thuê đang hoạt động
  //           const booking = activeBookings.find(b => b.room.toString() === room._id.toString());
  //           return {
  //               ...room,
  //               booking, // Nếu không tìm thấy, booking sẽ là 'undefined'
  //               price: (room.bedType?.price || 0) + (room.roomType?.price || 0) // Sửa thành dấu + để tính tổng giá
  //           };
  //       });

  //       res.render('manage/quanli', {
  //           isHome: true,
  //           Rooms: roomsWithBooking
  //       });
  //   })
  //   .catch(next);
    
  // }

  async index(req, res, next) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Đặt về đầu ngày hôm nay để so sánh

            // Lấy tất cả phòng
            const rooms = await Room.find()
                .populate('roomType')
                .populate('bedType')
                .lean();

            // Lấy tất cả các booking đang ở hoặc đã xác nhận
            const activeBookings = await Booking.find({ 
                bookingStatus: { $in: ['Confirmed', 'Checked In'] } 
            }).populate('customer').lean(); // Populate customer để hiển thị thông tin

            // Lấy tất cả dịch vụ để truyền vào modal
            const allServices = await Service.find().lean();


            const roomsWithStatus = rooms.map(room => {
                let currentBooking = null;
                let isBookedToday = false;
                let isCheckedIn = false; // Mới: kiểm tra trạng thái Checked In

                // Tìm booking hiện tại cho phòng này
                const roomBookings = activeBookings.filter(b => b.room.toString() === room._id.toString());

                // Duyệt qua các booking của phòng để tìm booking đang hoạt động hôm nay
                for (const booking of roomBookings) {
                    const checkInDate = new Date(booking.checkInDate);
                    checkInDate.setHours(0, 0, 0, 0);

                    const checkOutDate = new Date(booking.checkOutDate);
                    checkOutDate.setHours(0, 0, 0, 0);

                    // Logic: booking được tính là "active today" nếu:
                    // 1. Ngày nhận phòng là hôm nay HOẶC
                    // 2. Ngày trả phòng là hôm nay HOẶC
                    // 3. Hôm nay nằm giữa ngày nhận và ngày trả phòng
                    if ((today.getTime() >= checkInDate.getTime() && today.getTime() <= checkOutDate.getTime())) {
                        currentBooking = booking;
                        isBookedToday = true;

                        // Nếu booking này đã Check In, thì nó đang ở
                        if (booking.bookingStatus === 'Checked In') {
                            isCheckedIn = true;
                        }
                        break; // Tìm thấy booking hiện tại, thoát vòng lặp
                    }
                }
                
                // Xác định trạng thái phòng cuối cùng dựa trên booking và trạng thái dọn dẹp
                let roomOverallStatus = room.status; // Mặc định là trạng thái từ DB

                if (isBookedToday) {
                     roomOverallStatus = 'Đã đặt'; // Hoặc 'Đang ở'
                     if (isCheckedIn) {
                         roomOverallStatus = 'Đang ở'; // Ưu tiên 'Đang ở' nếu đã check-in
                     }
                } else if (room.status === 'Dọn dẹp') {
                    roomOverallStatus = 'Dọn dẹp';
                } else {
                    roomOverallStatus = 'Trống'; // Nếu không có booking hôm nay và không dọn dẹp
                }


                return {
                    ...room,
                    booking: currentBooking, // Chỉ gắn booking đang hoạt động hôm nay
                    isBookedToday: isBookedToday, // Biến mới để đánh dấu cho template
                    isCheckedIn: isCheckedIn, // Biến mới để đánh dấu phòng đang ở
                    displayStatus: roomOverallStatus, // Trạng thái dùng để hiển thị/CSS
                    price: (room.bedType?.price || 0) + (room.roomType?.price || 0)
                };
            });

            res.render('manage/quanli', {
                isHome: true,
                Rooms: roomsWithStatus,
                allServices: allServices // Truyền dịch vụ vào view
            });

        } catch (err) {
            console.error(err);
            next(err); // Chuyển lỗi xuống error-handling middleware
        }
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
        res.render('manage/quan_li_dichvu', { Services, selected, success: req.query.success === '1',query: req.query  })
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

  async dsMaGiamGia(req, res, next) {
          try {
              const discounts = await Discount.find().sort({ createdAt: -1 }).lean();
              res.render('manage/quan_li_khuyenmai', { discounts });
          } catch (error) {
              next(error);
          }
    }

  async dsTaiKhoanQuanTri(req, res, next) {
        try {
           
            const adminAccounts = await User.find({
                role:{ $in: ['admin', 'staff']} 
            })
            .sort({ role: 1, name: 1 }) 
            .lean();

            res.render('manage/quan_li_taikhoan', {
                accounts: adminAccounts
            });
        } catch (error) {
            console.error("Lỗi khi lấy danh sách tài khoản quản trị:", error);
            next(error);
        }
    }

  async showBookingCalendar(req, res, next) {
        try {
            const targetMonth = req.query.month ? moment(req.query.month, 'YYYY-MM') : moment();
            if (!targetMonth.isValid()) {
                // Xử lý nếu định dạng tháng không hợp lệ, quay về tháng hiện tại
                 targetMonth = moment();
            }

            const startOfMonth = targetMonth.clone().startOf('month');
            const endOfMonth = targetMonth.clone().endOf('month');
            const daysInMonth = [];
            let currentDate = startOfMonth.clone();
            while (currentDate.isSameOrBefore(endOfMonth)) {
                daysInMonth.push(currentDate.clone());
                currentDate.add(1, 'day');
            }

            // 2. Lấy dữ liệu
            const [rooms, bookingsInMonth] = await Promise.all([
                Room.find().sort({ roomNumber: 1 }).lean(), // Sắp xếp phòng theo số
                Booking.find({
                    // Tìm booking có khoảng thời gian chồng lấn với tháng đang xem
                    checkInDate: { $lte: endOfMonth.toDate() },
                    checkOutDate: { $gt: startOfMonth.toDate() }, // Dùng $gt để bao gồm cả ngày cuối
                    bookingStatus: { $in: ['Confirmed', 'Checked In'] } // Chỉ lấy booking hoạt động
                }).lean()
            ]);

            // 3. Chuẩn bị dữ liệu cho View
            const calendarData = rooms.map(room => {
                const dailyStatus = [];
                daysInMonth.forEach(day => {
                    let status = 'available'; // Mặc định là trống
                    let bookingInfo = null;

                    // Tìm xem có booking nào của phòng này bao gồm ngày 'day' không
                    const relevantBooking = bookingsInMonth.find(b =>
                        b.room.toString() === room._id.toString() &&
                        moment(b.checkInDate).isSameOrBefore(day, 'day') && // Check-in <= ngày đang xét
                        moment(b.checkOutDate).isAfter(day, 'day') // Check-out > ngày đang xét
                    );

                    if (relevantBooking) {
                        status = 'booked'; // Nếu tìm thấy -> đã đặt
                        bookingInfo = { // Lấy một số thông tin để hiển thị (tùy chọn)
                             _id: relevantBooking._id,
                             customerName: relevantBooking.customer.fullName,
                             checkIn: moment(relevantBooking.checkInDate).format('DD/MM'),
                             checkOut: moment(relevantBooking.checkOutDate).format('DD/MM')
                        };
                    } else if (room.status === 'Dọn dẹp') {
                         // Nếu phòng không có booking hôm đó NHƯNG đang ở trạng thái 'Dọn dẹp'
                         // (Logic này có thể cần xem lại, vì trạng thái Dọn dẹp chỉ áp dụng cho hôm nay)
                         // status = 'cleaning'; // Tạm thời bỏ qua cleaning trên lịch
                    }

                    dailyStatus.push({
                         date: day.format('YYYY-MM-DD'),
                         status: status,
                         bookingInfo: bookingInfo
                    });
                });
                return {
                    _id: room._id,
                    roomNumber: room.roomNumber,
                    dailyStatus: dailyStatus
                };
            });

            const todayDate = moment().format('YYYY-MM-DD');

            // 4. Render View
            res.render('manage/lich_dat_phong', {
                calendarData: calendarData,
                daysHeader: daysInMonth.map(d => ({ 
                    fullDate: d.format('YYYY-MM-DD'),
                    dayOfMonth: d.format('DD'),
                    dayOfWeek: d.format('dd') // Thứ (T2, T3...)
                })),
                currentMonth: targetMonth.format('MM/YYYY'),
                prevMonth: targetMonth.clone().subtract(1, 'month').format('YYYY-MM'),
                nextMonth: targetMonth.clone().add(1, 'month').format('YYYY-MM'),
                todayDate: todayDate
            });

        } catch (error) {
            console.error("Lỗi khi tạo lịch đặt phòng:", error);
            next(error);
        }
    }


}

module.exports = new ManageController()
