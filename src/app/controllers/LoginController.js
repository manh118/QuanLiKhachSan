const User = require('../models/User')

class LoginController {
  //[Get] home
  index(req, res, next) {
    res.render('login', {
      isLogin: true,
    })
  }

  login(req, res) {
    User.findOne(req.body)
      .then((user) => {
        if (!user) {
          return res.render('login', {
            isLogin: true,
            error: 'Tên đăng nhập hoặc mật khẩu không đúng',
          })
        }

        if (user.role === 'quanli') {
          req.session.user = {
            username: user.name,
            role: user.role,
          }

          return res.redirect('/manage')
        } else {
          // Đúng tài khoản nhưng không phải quản lý
          return res.render('login', {
            isLogin: true,
            error: 'Bạn không có quyền truy cập trang quản lý',
          })
        }
      })
      .catch((error) => {
        console.error(error)
        res.status(500).send('Lỗi máy chủ')
      })
  }
}

module.exports = new LoginController()
