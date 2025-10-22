const User = require('../models/User');

class ManageCustomerController {
    
    // [GET] /my-account/bookings
   async showUpdateCustomer(req, res, next) {
    try {
        // Tìm khách hàng (user) bằng ID từ URL
        const customer = await User.findById(req.params.id).lean();

        if (!customer) {
            // Xử lý trường hợp không tìm thấy khách hàng
            return res.status(404).send('Không tìm thấy khách hàng');
        }

        // Render ra view và truyền dữ liệu của khách hàng vào
        res.render('manage/quan_li_khachhang_update', { customer });

    } catch (error) {
        next(error);
    }
}


    // Xử lý dữ liệu gửi lên từ form để cập nhật
    updateCustomer(req, res, next) {
        // req.body chứa toàn bộ dữ liệu mới từ form
        User.updateOne({ _id: req.params.id }, req.body)
            .then(() => {
                res.json({ success: true, message: 'Cập nhật thông tin khách hàng thành công' });
            })
            .catch(err => {
                console.error(err);
                // Bắt lỗi nếu SĐT/Email/CMND bị trùng
                if (err.code === 11000) {
                    return res.status(400).json({ success: false, message: 'Thông tin (SĐT, Email hoặc CMND) bị trùng với một khách hàng khác.' });
                }
                res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
            });
    }
}

module.exports = new ManageCustomerController();
