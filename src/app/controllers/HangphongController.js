const Room = require('../models/Room')
const BedType = require('../models/BedType')
const RoomType = require('../models/RoomType')
const Service = require('../models/Service')

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
    

    Promise.all([                   // giúp thực hiện song song nhiều truy vấn MongoDB để lấy dữ liệu cần thiết trước khi render ra trang view
      Room.countDocuments(query),   // Đếm tổng số phòng thỏa điều kiện (để tính tổng số trang)
      Room.find(query)              // Lấy danh sách phòng trang hiện tại
        .populate('roomType', 'name description utilities price')
        .populate('bedType', 'name price')
        .skip(skip)
        .limit(Page_size)
        .lean({ virtuals: true }),
      BedType.find().lean(),     // Lấy danh sách giường
      RoomType.findById(roomTypeId).lean(),   // Lấy thôn tin hạng phòng đang xem
      ])
        .then(([totalRooms, Rooms, bedTypes, roomTypes]) => {
          const totalPages = Math.ceil(totalRooms / Page_size);

          // Tính giá phòng
          Rooms.forEach(room => {
            room.price = (room.bedType?.price || 0) * (room.roomType?.price || 0);
          });

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
          Service.find({}).lean(),
          RoomType.find().lean(),
          
        ])
          .then(([foundRoom, Services, RoomTypes]) => {
            if (!foundRoom) return res.status(404).send('Không tìm thấy phòng');

            // Tính giá
            foundRoom.price = (foundRoom.bedType?.price || 0) * (foundRoom.roomType?.price || 0);

            Room.find({ 
              roomType: foundRoom.roomType._id,
              roomNumber: { $ne: foundRoom.roomNumber },
              status: { $in: 'Trống' }
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
                  Services,
                  RelatedRooms,
                  RoomTypes,
                  currentRoomTypeId: foundRoom.roomType._id.toString(),
                });
              });
          })
          .catch(next);
      }
  
}

module.exports = new HangphongController()

