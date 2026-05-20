const Room = require('../models/Room');
const Review = require('../models/Review');

class SiteController {

  //[Get] /
  async index(req, res, next) {
    try {
      const [rooms, reviews] = await Promise.all([
        Room.find({})
          .populate('roomType', 'name description')
          .populate('bedType', 'name')
          .lean(),
        Review.find({ isApproved: true }).sort({ createdAt: -1 }).lean()
      ]);

      res.render('home', { rooms, reviews });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SiteController();
