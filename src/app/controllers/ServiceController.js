const Service = require('../models/Service')
const ServiceMonAn = require('../models/ServiceMonAn')

class ServiceController {
  //[Get] home
  tiec(req, res, next) {
    res.render('Dichvu/tiec')
  }

  amthuc(req, res, next) {
    const grouped = {
      STEAK: [], SOUP: [], SEAFOOD: [], PIZZA: [], SALAD: [], RICE: [],
    };
    
    ServiceMonAn.find({}).lean()
      .then((dishes) => {
        dishes.forEach((dish) => {
          const category = dish.type?.toUpperCase();
          if (grouped[category]) {
            grouped[category].push(dish);
          }
        });

        res.render('Dichvu/amthuc', {
          layout: 'service_layout',
          ServiceMonAn: dishes,           // toàn bộ món ăn nếu bạn cần dùng
          DishesByCategory: grouped,      // món ăn đã phân loại theo nhóm
        });
      })
      .catch(next);
  }


}

module.exports = new ServiceController()
