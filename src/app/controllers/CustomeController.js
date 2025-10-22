// app/controllers/CustomerController.js
const Booking = require('../models/Booking');

class CustomerController {
    
    // [GET] /my-account/bookings
    async showMyBookings(req, res, next) {
        try {
            // 1. Lấy userId từ session đã lưu
            const userId = req.session.user._id;

            // 2. Tìm tất cả đơn đặt phòng có userId đó
            // .populate('roomId') sẽ lấy thông tin phòng (ví dụ: roomNumber)
            // .sort({ createdAt: -1 }) để xếp đơn mới nhất lên đầu
            const bookings = await Booking.find({ userId: userId })
                                          .populate('room') // Thay 'roomId' bằng trường liên kết phòng của bạn
                                          .sort({ createdAt: -1 })
                                          .lean();
            
            // 3. Render ra view
            res.render('customer/my-bookings', { 
                layout: 'main', // Hoặc layout nào bạn muốn
                bookings: bookings 
            });

        } catch (error) {
            console.error(error);
            next(error);
        }
    }

    // [GET] /account/logout
    logout(req, res, next) {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/'); // Xóa session và về trang chủ
        });
    }
}

module.exports = new CustomerController();