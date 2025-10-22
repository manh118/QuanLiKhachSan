const siteRouter = require('./site')
const gioithieuRouter = require('./gioithieu')
const hangphongRouter = require('./hangphong')
const accountRouter = require('./account')
const manageRouter = require('./manage')
const serviceRouter = require('./service')
const bookingRouter = require('./booking')
const questionRouter = require('./question')
const manageLayout = require('../middleware/manage_layout')


const RoomType = require('../app/models/RoomType');


function route(app) {

  app.use((req, res, next) => {
    res.locals.isHome = req.path === '/';
    next();
  });

  app.use((req, res, next) => {
  RoomType.find({})
    .lean()
    .then(RoomTypes => {
      res.locals.RoomTypes = RoomTypes;
      next();
    })
    .catch(next);
});


  app.use('/manage',manageLayout, manageRouter)
  app.use('/account', accountRouter)
  app.use('/dichvu', serviceRouter)
  app.use('/hangphong', hangphongRouter)
  app.use('/datphong', bookingRouter)
  app.use('/gioi_thieu', gioithieuRouter)
  app.use('/question', questionRouter)
  app.use('/', siteRouter)
}

module.exports = route
