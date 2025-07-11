const User = require('../models/User')

class LoginController {
  //[Get] home
  index(req, res, next) {
    res.render('login', {
      layout: 'login_layout'
    })
  }

  login(req, res) {
  User.findOne(req.body)
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        });
      }

      if (user.role !== 'quanli') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập trang quản lý',
        });
      }
      req.session.user = {
        username: user.name,
        role: user.role,
      };

      // Đăng nhập thành công
      return res.json({
        success: true,
        message: 'Đăng nhập thành công',
        redirect: '/manage',
        user: {
          username: user.name,
          role: user.role,
        }
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi máy chủ',
      });
    });
}

}

module.exports = new LoginController()
