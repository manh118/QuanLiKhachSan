const Room = require('../models/Room')
const BedType = require('../models/BedType')
const RoomType = require('../models/RoomType')

class ManageRoomController {
  async showCreateRoom(req, res) {
    try {
      const roomTypes = await RoomType.find({}).lean()
      const bedTypes = await BedType.find({}).lean()
      res.render('manage/quan_li_phong_create', { roomTypes, bedTypes })
    } catch (error) {
      res.status(500).send('Lỗi khi tải dữ liệu')
    }
  }

  CreateRoom(req, res, next) {
    const imagePath = req.file ? `/img/Room/${req.file.filename}` : '';
  //const imagePaths = req.files ? req.files.map(file => `/img/Room/${file.filename}`) : [];


    const room = new Room({
      roomNumber: req.body.roomNumber,
      bedType: req.body.bedType,
      roomType: req.body.roomType,
      status: req.body.status,
      img: imagePath,
    })
    room
      .save()
      .then(() => res.json({ success: true, message: 'Thêm phòng thành công!' }))
      .catch((err) => {
        console.error(err)
        res.status(500).json({ success: false, message: 'Lỗi khi thêm phòng', error: err });
      })
  }

  showUpdate(req, res, next) {
    Promise.all([
      Room.findById(req.params.id).lean(),
      RoomType.find({}).lean(),
      BedType.find({}).lean(),
    ])
      .then(([room, roomTypes, bedTypes]) => {
        res.render('manage/quan_li_phong_update', { room, roomTypes, bedTypes })
      })
      .catch(next)
  }

  update(req, res, next) {
    const updatedData = {
      roomNumber: req.body.roomNumber,
      bedType: req.body.bedType,
      roomType: req.body.roomType,
      status: req.body.status,
    }

    Room.updateOne({ _id: req.params.id }, updatedData)
      .then(() => res.json({ success: true, message: 'Cập nhật thành công' }))
      .catch(err => {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật', error: err });
      })
  }

   delete(req, res, next) {
      Room.deleteOne({ _id: req.params.id})
        .then(() => res.redirect('/manage/quan_li_phong'))
        .catch(next)
    }
}

module.exports = new ManageRoomController()
