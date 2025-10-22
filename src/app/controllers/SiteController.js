const Room = require('../models/Room')

class SiteController {

  //[Get] home
  index(req, res, next) {
  Room.find({})
    .populate('roomType', 'name description')      
    .populate('bedType', 'name' )       
    .lean()
    .then((rooms) => {
      res.render('home', { rooms });  
    })
    .catch(next);
}
}

module.exports = new SiteController()
