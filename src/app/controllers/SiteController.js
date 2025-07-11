const Room = require('../models/Room')

class SiteController {

  //[Get] home
  index(req, res, next) {
  Room.find({})
    .populate('roomType', 'name description')      // chỉ lấy field name của RoomType
    .populate('bedType', 'name' )       // chỉ lấy field name của BedType
    .lean()
    .then((rooms) => {
      res.render('home', { rooms });   // truyền danh sách rooms xuống view
    })
    .catch(next);
}
}

module.exports = new SiteController()
