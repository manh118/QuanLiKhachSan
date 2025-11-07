const User = require('../models/User')
const Booking = require('../models/Booking');

class LoginController {

  showLogin(req, res, next) {
    res.render('login', {
      layout: 'login_layout'
    })
  }

  login(req, res) {
    const { name, password } = req.body;
    User.findOne({ name: name, password: password }) // (Bạn đang dùng logic không bảo mật, tạm giữ nguyên)
      .then((user) => {
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Tên đăng nhập hoặc mật khẩu không đúng',
          });
        }

        // 1. Gán session, THÊM _id VÀO ĐÂY
        req.session.user = {
          _id: user._id, // <-- CỰC KỲ QUAN TRỌNG
          username: user.name,
          role: user.role,
          phone: user.phone, // <-- THÊM DÒNG NÀY
          email: user.email,
          fullName: user.fullName
        };

        // 2. Quyết định điều hướng dựa trên role
        let redirectPath = '/'; // Mặc định về trang chủ cho 'user'
        if (user.role === 'staff' || user.role === 'admin') {
            redirectPath = '/manage'; // 'quanli' hoặc 'admin' thì vào trang quản lý
        }

        // 3. Lưu session TRƯỚC KHI trả về
        req.session.save((err) => {
          if (err) {
            console.error('Lỗi khi lưu session:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server khi lưu session' });
          }

          // 4. Gửi JSON với đường dẫn đã quyết định
          return res.json({
            success: true,
            message: 'Đăng nhập thành công',
            redirect: redirectPath, // <-- Sử dụng đường dẫn động
            user: req.session.user
          });
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

  showRegis(req, res, next) {
    res.render('regis', {
      layout: 'login_layout'
    });
  }

  async regis(req, res, next) {
    const { name, phone, email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!name || !phone || !password) {
        return res.status(400).json({
            success: false,
            message: 'Vui lòng nhập Tên đăng nhập, SĐT và Mật khẩu'
        });
    }

    try {
        // 2. Kiểm tra tồn tại
        const orQuery = [
            { name: name },
            { phone: phone }
        ];
        if (email && email.trim() !== '') { // Chỉ kiểm tra email nếu người dùng nhập
            orQuery.push({ email: email });
        }

        const existingUser = await User.findOne({ $or: orQuery });
        
        if (existingUser) {
            let message = 'Thông tin đăng ký đã tồn tại';
            if (existingUser.name === name) message = 'Tên đăng nhập này đã tồn tại';
            else if (existingUser.phone === phone) message = 'Số điện thoại này đã tồn tại';
            else if (email && existingUser.email === email) message = 'Email này đã tồn tại';
            
            return res.status(400).json({
                success: false,
                message: message
            });
        }

        // 3. Tạo user mới (lưu plain text)
        const newUser = new User({
            name: name,
            phone: phone,
            email: email || null,
            password: password,   
            role: 'user' // Model của bạn yêu cầu 'role' là required
        });

        // 4. Lưu vào DB
        await newUser.save(); // Lỗi validation (nếu có) sẽ bị bắt ở catch

        // 5. Trả về thành công
        return res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
            redirect: '/account/login'
        });

    } catch (error) {
        // Bắt lỗi validation từ Mongoose
        console.error(error); 
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ, không thể đăng ký',
        });
    }
  }

  async showMyBookings(req, res, next) {
        try {
            // 1. Lấy userId từ session đã lưu
            const userId = req.session.user._id;

            // 2. Tìm tất cả đơn đặt phòng có userId đó
            const bookings = await Booking.find({ userId: userId })
                                          .populate('room') // Thay 'roomId' bằng trường liên kết phòng của bạn
                                          .sort({ createdAt: -1 })
                                          .lean();
            
            // 3. Render ra view
            res.render('account/my_bookings', { 
                layout: 'main', // Hoặc layout nào bạn muốn
                bookings: bookings 
            });

        } catch (error) {
            console.error(error);
            next(error);
        }
  }


  logout(req, res, next) {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/account/login'); // Xóa session và về trang chủ
        });
  }
} 

module.exports = new LoginController()
