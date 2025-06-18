const Service = require('../models/Service')


class ManageServiceController {
    showServiceRoom(req, res) {
        res.render('manage/quan_li_dichvu_create');
  }

  CreateService(req, res, next) {
    const service = new Service(req.body)
    service.save()
      .then(() => res.redirect('/manage/quan_li_dichvu') )
      .catch(next)
  }

  showUpdate(req, res, next) {
    Promise.all([
      Room.findById(req.params.id).lean(),
      RoomType.find({}).lean(),
      BedType.find({}).lean(),
    ])
      .then(([room, roomTypes, bedTypes]) => {
        res.render('manage/quan_li_dichvu_update', { room, roomTypes, bedTypes })
      })
      .catch(next)
  }

  update(req, res, next) {
    const updatedData = {
      roomBumber: req.body.roomBumber,
      bedType: req.body.bedType,
      roomType: req.body.roomType,
      status: req.body.status,
    }

    Room.updateOne({ _id: req.params.id }, updatedData)
      .then(() => res.redirect('/manage/quan_li_dichvu'))
      .catch(next)
  }

   delete(req, res, next) {
      Room.deleteOne({ _id: req.params.id})
        .then(() => res.redirect('/manage/quan_li_dichvu'))
        .catch(next)
    }
}

module.exports = new ManageServiceController()
