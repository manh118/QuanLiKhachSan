const User = require('../app/models/User'); // Đảm bảo đường dẫn đúng

function checkLoginAndSetLocals(req, res, next) {
    if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'staff')) {
        // Đã đăng nhập và là admin hoặc staff
        res.locals.isManage = true;
        res.locals.userRole = req.session.user.role; // <-- Gắn userRole
        res.locals.username = req.session.user.name; // <-- Gắn username (hoặc fullName)
        next(); // Cho phép đi tiếp
    } else {
        // Chưa đăng nhập hoặc role không hợp lệ
        req.flash('error_msg', 'Bạn không có quyền truy cập trang quản lý.');
        res.redirect('/account/login');
    }
}

// Middleware kiểm tra vai trò cụ thể
function checkRole(requiredRole) {
    return (req, res, next) => {
        // Middleware này giả định checkLoginAndSetLocals đã chạy
        if (req.session.user.role === requiredRole) {
            next(); // Vai trò khớp, cho phép đi tiếp
        } else {
            // Vai trò không khớp
            req.flash('error_msg', 'Bạn không có quyền truy cập chức năng này.');
            res.redirect('/manage'); // Chuyển hướng về trang tổng quan (hoặc trang lỗi)
        }
    };
}

module.exports = {
    checkRole,
    checkLoginAndSetLocals // Thay thế checkAdminOrStaff bằng hàm này
};