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
    
      Service.findById(req.params.id)
      .lean()
      .then(service => {
        res.render('manage/quan_li_dichvu_update', {service} )
      })
      .catch(next)
  }

  update(req, res, next) {
    const updatedData = {
      idService: req.body.idService,
      name: req.body.name,
      price: req.body.price,
      unit: req.body.unit,
    }

    Service.updateOne({ _id: req.params.id }, updatedData)
      .then(() => {
        res.redirect('/manage/quan_li_dichvu?success=1');
      })
      .catch(next)
  }

   delete(req, res, next) {
      Service.deleteOne({ _id: req.params.id})
        .then(() => res.redirect('/manage/quan_li_dichvu'))
        .catch(next)
    }
}

module.exports = new ManageServiceController()
