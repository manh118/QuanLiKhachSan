const Rooms = require('../models/Room')

class SiteController {

  //[Get] home
  Show(req, res, next) {
  
    res.render('question');

  }
}

module.exports = new SiteController()
