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

  

  DanhSachTuongUng(req, res, next) {
    const roomTypeId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * Page_size;
    const selectedBedType = req.query.bedType

    let query = {roomType: roomTypeId}
    if (selectedBedType) {
      query.bedType = selectedBedType
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
          });
        })
        .catch(next);
}


  ShowDetail(req, res, next) {
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

// DanhSachTuongUng(req,res,next){
  //   const roomTypeId = req.params.id;
  //   const page = parseInt(req.query.page) || 1;
  //   const skip = (page - 1) * Page_size;

  //   Room.find({ roomType: roomTypeId })
  //     .populate('roomType', 'name description utilities')
  //     .populate('bedType', 'name price ')
  //     .lean({ virtuals: true })
  //     .then((Rooms) => {

  //     Rooms.forEach(room => {
  //       room.price = (room.bedType?.price || 0) + (room.roomType?.price || 0);
  //     });

  //       res.render('phong', { Rooms });
  //     })
  //     .catch(next);
  // }