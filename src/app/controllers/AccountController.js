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
            // KIỂM TRA: Nếu user này chưa có password (tức là tài khoản khách vãng lai tự động tạo lúc đặt phòng)
            if (!existingUser.password) {
                // Đảm bảo tên đăng nhập (name) không bị trùng với một tài khoản KHÁC
                const nameTaken = await User.findOne({ name: name, _id: { $ne: existingUser._id } });
                if (nameTaken) {
                    return res.status(400).json({ success: false, message: 'Tên đăng nhập này đã tồn tại' });
                }

                // Cập nhật tài khoản khách thành tài khoản chính thức
                existingUser.name = name;
                existingUser.password = password;
                if (email) existingUser.email = email;
                await existingUser.save();
                
                return res.status(201).json({
                    success: true,
                    message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
                    redirect: '/account/login'
                });
            }

            // Nếu user đã có password (tài khoản đã đăng ký thật) -> Báo lỗi
            let message = 'Thông tin đăng ký đã tồn tại';
            if (existingUser.name === name) message = 'Tên đăng nhập này đã tồn tại';
            else if (existingUser.phone === phone) message = 'Số điện thoại này đã tồn tại';
            else if (email && existingUser.email === email) message = 'Email này đã tồn tại';
            
            return res.status(400).json({
                success: false,
                message: message
            });
        }

        // 3. Nếu chưa tồn tại bất kỳ thông tin nào -> Tạo user mới (lưu plain text)
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
            // 1. Lấy thông tin user từ session
            const userId = req.session.user._id;
            const userPhone = req.session.user.phone;
            const userEmail = req.session.user.email;

            // 2. Tự động nhận diện và ghép nối các phiếu thuê vãng lai (guest) 
            // có cùng số điện thoại hoặc email với tài khoản hiện tại.
            const query = {
                $or: [
                    { userId: userId }
                ]
            };
            
            if (userPhone) {
                query.$or.push({ 'customer.phone': userPhone });
            }
            
            if (userEmail) {
                query.$or.push({ 'customer.email': userEmail });
            }

            // 3. Tìm tất cả đơn đặt phòng thỏa mãn
            const bookings = await Booking.find(query)
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


  showLookup(req, res, next) {
      res.render('account/lookup', {
          layout: 'main'
      });
  }

  async lookupBooking(req, res, next) {
      const { phone, email } = req.body;
      
      if (!phone) {
          return res.render('account/lookup', {
              layout: 'main',
              error: 'Vui lòng nhập Số điện thoại',
              phone, email
          });
      }

      try {
          const query = { 'customer.phone': phone };
          if (email && email.trim() !== '') {
              query['customer.email'] = email;
          }

          const bookings = await Booking.find(query)
                                        .populate('room')
                                        .sort({ createdAt: -1 })
                                        .lean();

          if (bookings.length === 0) {
              return res.render('account/lookup', {
                  layout: 'main',
                  error: 'Không tìm thấy đơn đặt phòng nào với thông tin này.',
                  phone, email
              });
          }

          res.render('account/lookup', {
              layout: 'main',
              success: 'Tra cứu thành công!',
              bookings: bookings,
              phone, email
          });
      } catch (error) {
          console.error(error);
          res.render('account/lookup', {
              layout: 'main',
              error: 'Lỗi hệ thống khi tra cứu đơn hàng.',
              phone, email
          });
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
