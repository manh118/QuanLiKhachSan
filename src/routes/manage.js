const express = require('express');
const router = express.Router();
const manageController = require('../app/controllers/ManageController');
const manageRoomTypeRouter = require('./manageRoomType');
const manageRoomRouter = require('./manageRoom')
const manageServiceRouter = require('./manageService')
const manageEmployeeRouter = require('./manageEmployee')
const manageBillRouter = require('./manageBill')
const manageBookingRouter = require('./manageBooking')
const manageCustomerRouter = require('./manageCustomer')
const reportRouter = require('./manageReport')


// Áp dụng middleware cho tất cả các route trong /manage
router.use((req, res, next) => {
  if (req.session.user?.role === 'admin') {
    res.locals.isManage = true;
    next();
  } else {
    res.redirect('/account/login');
  }
});

router.use('/quan_li_phong/crud', manageRoomRouter);
router.use('/quan_li_dichvu/crud', manageServiceRouter);
router.use('/quan_li_nhanvien/crud', manageEmployeeRouter);
router.use('/quan_li_hoadon/crud', manageBillRouter);
router.use('/quan_li_phieuthue/crud', manageBookingRouter);
router.use('/quan_li_hangphong/crud', manageRoomTypeRouter);
router.use('/quan_li_khachhang/crud', manageCustomerRouter);
router.use('/bao_cao', reportRouter);

// Các route quản lý
router.get('/quan_li_nhanvien', manageController.dsNhanVien);
router.get('/quan_li_dichvu', manageController.dsDichVu);
router.get('/quan_li_phong', manageController.dsPhong);
router.get('/quan_li_hangphong', manageController.dsHangPhong);
router.get('/quan_li_phieuthue', manageController.dsPhieuThue);
router.get('/quan_li_hoadon', manageController.dsHoaDon);
router.get('/quan_li_khachhang', manageController.dsKhachHang);
router.get('/logout', manageController.logout);
router.get('/', manageController.index);


module.exports = router;
