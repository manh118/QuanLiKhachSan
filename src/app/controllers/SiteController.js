const Rooms = require('../models/Room')

class SiteController {

  //[Get] home
  index(req, res, next) {
  
    res.render('home');

  }
}

module.exports = new SiteController()
