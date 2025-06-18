const Rooms = require('../models/Room')

class SiteController {

  //[Get] home
  index(req, res, next) {
  //   Rooms.find({})
  //     .lean()
  //     .then((rooms) => res.render('home',{rooms: rooms}))
  //     .catch((err) => next(err))
  // }
  res.render('gioithieu')

  }
}

module.exports = new SiteController()
