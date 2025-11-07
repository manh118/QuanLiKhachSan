const Room = require('../models/Room')
const BedType = require('../models/BedType')
const RoomType = require('../models/RoomType')
const Service = require('../models/Service')
const moment = require('moment');
const Booking = require('../models/Booking');

const Page_size = 6;


class HangphongController {

  //[Get] home
  Hienthi(req, res, next) {
   
     RoomType.find({})
        .lean()
        .then(RoomTypes => {
             res.render('hangphong', {RoomTypes});
        })
        .catch(next);
  }

  

  DS_HangPhong_TuongUng(req, res, next) {
    const roomTypeId = req.params.id;  // lấy id được gửi đi trên url
    const page = parseInt(req.query.page) || 1;   // Chọn trang, nếu k có thì là 1
    const skip = (page - 1) * Page_size;  
    const selectedBedType = req.query.bedType
    const selectedStatus = req.query.status;

    let query = {roomType: roomTypeId}

    if (selectedBedType) {
      query.bedType = selectedBedType
    }

    if (selectedStatus) {
      query.status = selectedStatus;
    }    
    

    Promise.all([                   
      Room.countDocuments(query),   
      Room.find(query)             
        .populate('roomType', 'name description utilities price')
        .populate('bedType', 'name price')
        .skip(skip)
        .limit(Page_size)
        .lean({ virtuals: true }),
      BedType.find().lean(),     
      RoomType.findById(roomTypeId).lean(),   
      ])
        .then(([totalRooms, Rooms, bedTypes, roomTypes]) => {
          const totalPages = Math.ceil(totalRooms / Page_size);

          res.render('phong', {
            Rooms,
            bedTypes,
            roomTypes,
            currentPage: page,
            totalPages,
            roomTypeId, // để giữ link dạng ?page=2
            selectedBedType,
            selectedStatus,
          });
        })
        .catch(next);
}


      Chi_Tiet_Phong(req, res, next) {
        Promise.all([
          Room.findOne({ roomNumber: req.params.roomNumber })
            .populate('bedType')
            .populate('roomType')
            .lean(),
          Service.find({ isActive: true}).lean(),
          RoomType.find().lean(),
          
        ])
          .then(([foundRoom, activeServices, RoomTypes]) => {
            if (!foundRoom) return res.status(404).send('Không tìm thấy phòng');
            
            Room.find({ 
              roomType: foundRoom.roomType._id,
              roomNumber: { $ne: foundRoom.roomNumber }, // Khác mã phòng hiện tại
              status: 'Trống'                 // Chỉ chọn phòng trống
            })
              .limit(3)
              .populate('bedType')
              .populate('roomType')
              .lean({ virtuals: true })
              .then(RelatedRooms => {
                RelatedRooms.forEach(room => {
                  room.price = (room.bedType?.price || 0) * (room.roomType?.price || 0);
                });
            
                res.render('ChiTietPhong', {
                  Room: foundRoom,
                  Services: activeServices,
                  RelatedRooms,
                  RoomTypes,
                  currentRoomTypeId: foundRoom.roomType._id.toString(),
                  user: req.session.user
                });
              });
          })
          .catch(next);
      }

      async getRoomAvailability(req, res, next) {
        try {
            const roomId = req.params.roomId;
            // Lấy tháng từ query, hoặc tháng hiện tại
            const targetMonth = req.query.month ? moment(req.query.month, 'YYYY-MM') : moment();
            if (!targetMonth.isValid()) {
                return res.status(400).json({ message: 'Định dạng tháng không hợp lệ (YYYY-MM)' });
            }

            const startOfMonth = targetMonth.clone().startOf('month').toDate();
            const endOfMonth = targetMonth.clone().endOf('month').toDate();
            const today = moment().startOf('day').toDate(); // Lấy ngày hôm nay

            // Tìm các booking hoạt động của phòng này chồng lấn với tháng
            const bookings = await Booking.find({
                room: roomId,
                bookingStatus: { $in: ['Confirmed', 'Checked In'] },
                checkInDate: { $lte: endOfMonth },
                checkOutDate: { $gt: startOfMonth }
            }, 'checkInDate checkOutDate').lean();

            // Tạo mảng chứa các ngày đã bị đặt
            const bookedDates = [];
            let currentDate = moment(startOfMonth);
            const monthEndMoment = moment(endOfMonth);

            while (currentDate.isSameOrBefore(monthEndMoment, 'day')) {
                // Đánh dấu ngày quá khứ là 'past'
                if (currentDate.isBefore(today, 'day')) {
                    bookedDates.push({ date: currentDate.format('YYYY-MM-DD'), status: 'past' });
                    currentDate.add(1, 'day');
                    continue; // Chuyển sang ngày tiếp theo
                }

                // Kiểm tra xem ngày có nằm trong booking nào không
                let isBooked = false;
                for (const booking of bookings) {
                    const checkInMoment = moment(booking.checkInDate);
                    const checkOutMoment = moment(booking.checkOutDate);
                    if (currentDate.isSameOrAfter(checkInMoment, 'day') && currentDate.isBefore(checkOutMoment, 'day')) {
                        isBooked = true;
                        break;
                    }
                }
                
                if (isBooked) {
                    bookedDates.push({ date: currentDate.format('YYYY-MM-DD'), status: 'booked' });
                } else {
                    // Nếu không 'booked' và không 'past' thì là 'available'
                    bookedDates.push({ date: currentDate.format('YYYY-MM-DD'), status: 'available' });
                }
                currentDate.add(1, 'day');
            }

            res.json({
                month: targetMonth.format('YYYY-MM'),
                availability: bookedDates // Trả về mảng các đối tượng {date, status}
            });

        } catch (error) {
            console.error("Lỗi khi lấy lịch trống phòng:", error);
            res.status(500).json({ message: 'Lỗi server' });
            next(error);
        }
    }
  
}

module.exports = new HangphongController()

