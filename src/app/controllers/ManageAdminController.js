const User = require('../models/User')

class ManageAdminController {
    // [GET] /manage/quan_li_taikhoan

    // [GET] /manage/quan_li_taikhoan/create
    showCreateForm(req, res, next) {
        res.render('manage/quan_li_taikhoan_create', {
            pageTitle: 'Thêm Tài Khoản Quản Trị Mới',
            messages: req.flash()
        });
    }

    // [POST] /manage/quan_li_taikhoan/store
    async store(req, res, next) {
        const { name, password, confirmPassword, role } = req.body; 

        // 1. Kiểm tra đầu vào (tương tự regis)
        if (!name || !password || !confirmPassword || !role) { 
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ các trường bắt buộc.'
            });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu và xác nhận mật khẩu không khớp.'
            });
        }
        if (password.length < 1) { // Mật khẩu tối thiểu 1 ký tự
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu không được để trống.'
            });
        }
        if (!['admin', 'staff'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Vai trò không hợp lệ.'
            });
        }

        try {
            // 2. Kiểm tra tên đăng nhập đã tồn tại chưa
            const existingUser = await User.findOne({ name: name }); 
            if (existingUser) {
                return res.status(409).json({ // 409 Conflict cho trường hợp trùng lặp
                    success: false,
                    message: 'Tên đăng nhập này đã tồn tại.'
                });
            }

            // 3. Tạo tài khoản mới
            const newUser = new User({
                name, 
                password, 
                role
            });

            // 4. Lưu vào DB
            await newUser.save(); 

            // 5. Trả về thành công
            return res.status(201).json({ // 201 Created
                success: true,
                message: `Tài khoản '${name}' đã được tạo thành công!`,
                redirect: '/manage/quan_li_taikhoan' // Client sẽ dùng cái này để redirect
            });

        } catch (error) {
            console.error(error);
            let errorMessage = 'Lỗi máy chủ, không thể tạo tài khoản.';

            if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
                errorMessage = 'Tên đăng nhập này đã tồn tại.'; // Lặp lại kiểm tra name để đảm bảo
            }
            

            // Bắt lỗi validation từ Mongoose Schema (nếu có, ví dụ role không hợp lệ)
            if (error.name === 'ValidationError') {
                 errorMessage = Object.values(error.errors).map(val => val.message).join(', ');
            }
            
            return res.status(500).json({
                success: false,
                message: errorMessage
            });
        }
    }

    // [DELETE] /manage/quan_li_taikhoan/:id
    async delete(req, res, next) {
        try {
            const accountIdToDelete = req.params.id;

            // Không cho phép tài khoản tự xóa chính mình
            if (req.session.user._id.toString() === accountIdToDelete) {
                req.flash('error_msg', 'Bạn không thể xóa tài khoản của chính mình.');
                return res.redirect('/manage/quan_li_taikhoan');
            }
            
            const deletedAccount = await User.findByIdAndDelete(accountIdToDelete);
            if (deletedAccount) {
                req.flash('success_msg', `Tài khoản '${deletedAccount.username}' đã được xóa.`);
            } else {
                req.flash('error_msg', 'Không tìm thấy tài khoản để xóa.');
            }
            res.redirect('/manage/quan_li_taikhoan');
        } catch (err) {
            console.error(err);
            req.flash('error_msg', 'Lỗi khi xóa tài khoản.');
            res.redirect('/manage/quan_li_taikhoan');
        }
    }

    // TODO: Thêm các method edit, update nếu cần sau
}

module.exports = new ManageAdminController();