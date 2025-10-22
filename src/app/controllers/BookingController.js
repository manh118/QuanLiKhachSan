const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User'); 

class BookingController {

  // Tạo booking
  async createBooking(req, res, next) {
    const {
      roomId, checkInDate, checkOutDate,
      nguoiLon, treEm, fullName, phone, email, services,source
    } = req.body;

    try {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const soNgay = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

      // 1. Tìm thông tin phòng
      const room = await Room.findById(roomId).populate('roomType');
      if (!room) {
        return res.status(404).json({ message: 'Không tìm thấy phòng' });
      }

      const roomPrice = room.roomType.price;
      const totalRoomCost = soNgay * roomPrice;
      const roomNumber = room.roomNumber;

      // 2. Tính toán dịch vụ
      let totalServiceCost = 0;
      const serviceDetails = services
        .filter(s => s.quantity > 0)
        .map(s => {
          totalServiceCost += s.quantity * s.price;
          return {
            service: s.id, // Giả sử s.id là service ObjectId
            quantity: s.quantity,
            price: s.price
          };
        });
      
      // const userId = req.session.user?._id || null;

      const totalAmount = totalRoomCost + totalServiceCost;
      const depositAmount = Math.round(totalAmount / 4); // Tiền cọc 50%
      const remainingAmount = totalAmount - depositAmount;

      let bookingUserId = null;
      
      if (req.session.user?._id) {
                // Trường hợp 1: Khách đã đăng nhập
                bookingUserId = req.session.user._id;
      } else {
          // Trường hợp 2: Khách vãng lai
          // Thử tìm xem có khách hàng nào đã tồn tại với SĐT này chưa
         const findQuery = [
              { phone: phone }
          ];
          if (email && email.trim() !== '') {
              findQuery.push({ email: email });
          }
          
          let guestUser = await User.findOne({ $or: findQuery });

          if (!guestUser) {
              // Nếu chưa có -> Tạo một tài khoản "khách" cho họ
              guestUser = new User({
                  phone: phone,
                  email: email,
                  fullName: fullName,
                  role: 'user', 
              });
              await guestUser.save();
          }
          bookingUserId = guestUser._id;
      }

      // 4. Tạo đối tượng Booking mới
      const booking = new Booking({
        room: roomId,
        roomNumber,
        checkInDate,
        checkOutDate,
        soNgay,
        nguoiLon,
        treEm,
        roomPrice,
        totalRoomCost,
        customer: { fullName, phone, email }, 
        services: serviceDetails,
        totalServiceCost,
        totalAmount: totalAmount,
        userId: bookingUserId ,
        depositAmount: depositAmount,        
        remainingAmount: remainingAmount,    
        bookingStatus: 'Pending Deposit',
        source: source || 'website'
      });

      // 5. Lưu booking mới
      const savedBooking = await booking.save();

      const io = req.app.get('socketio');

      if (booking.source === 'website' && io) {
          console.log(` Phát sự kiện 'new_booking' cho booking ID: ${booking._id}`);
          io.emit('new_booking', { 
              message: `Phòng ${booking.roomNumber} vừa được đặt bởi ${booking.customer.fullName}!`,
              bookingDetails: {
                  _id: booking._id,
                  roomNumber: booking.roomNumber,
                  customerName: booking.customer.fullName,
                  checkInDate: booking.checkInDate,
                  checkOutDate: booking.checkOutDate,
                  totalAmount: booking.totalAmount
              }
          });
      }

      // 7. Trả về thành công
      res.status(201).json({ message: 'success', data: savedBooking });

    } catch (err) {
      console.error('Lỗi lưu booking:', err);
      res.status(500).json({ message: 'fail' });
    }
  }

  // Cập nhập trạng thái
  async confirmDeposit(req, res, next) {
        const bookingId = req.params.id;

        try {
            // 1. Tìm booking cần xác nhận
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).send('Không tìm thấy phiếu thuê');
            }

            // 2. Kiểm tra trạng thái hiện tại
            if (booking.bookingStatus !== 'Pending Deposit') {
                return res.redirect('/manage/quan_li_phieuthue?error=InvalidStatus');
            }

            // 3. Cập nhật trạng thái Booking
            booking.bookingStatus = 'Confirmed';
            await booking.save();

            // 4. Cập nhật trạng thái Room thành 'Đã đặt'
            await Room.findByIdAndUpdate(booking.room, { status: 'Đã đặt' });

            // 5. Chuyển hướng về trang danh sách với thông báo thành công
            res.redirect('/manage/quan_li_phieuthue?success=DepositConfirmed');

        } catch (error) {
            console.error('Lỗi khi xác nhận cọc:', error);
            next(error); // Chuyển lỗi cho middleware xử lý
        }
    }

  // Check In
  async checkIn(req, res, next) {
        const bookingId = req.params.id;
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking || booking.bookingStatus !== 'Confirmed') {
                return res.redirect('/manage/quan_li_phieuthue?error=NotInConfirmedState');
            }

            booking.bookingStatus = 'Checked In';
            await booking.save();

            res.redirect('/manage/quan_li_phieuthue?success=CheckedIn');
        } catch (error) {
            console.error('Lỗi khi check-in:', error);
            next(error);
        }
    }

  // Check Out
  async checkOut(req, res, next) {
        const bookingId = req.params.id;
        try {
            // 1. Tìm booking
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                 return res.status(404).json({ message: 'Không tìm thấy phiếu thuê' });
            }
            // Chỉ nên checkout booking đang Check In
            if (booking.bookingStatus !== 'Checked In') {
                 return res.status(400).json({ message: 'Phiếu thuê không ở trạng thái Check In' });
            }

            // 2. Cập nhật trạng thái Booking
            booking.bookingStatus = 'Checked Out';
            await booking.save();

            // 3. Cập nhật trạng thái Room thành 'Trống'
            await Room.findByIdAndUpdate(booking.room, { status: 'Dọn dẹp' });

            // 4. Trả về thành công
            res.json({ message: 'success' });

        } catch (error) {
            console.error('Lỗi khi check-out:', error);
            res.status(500).json({ message: 'Lỗi server khi check-out' });
        }
    }

    async cancelBooking(req, res, next) {
        const bookingId = req.params.id;
        try {
            // 1. Tìm booking
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).send('Không tìm thấy phiếu thuê');
            }

            // Chỉ cho hủy nếu đang Chờ cọc hoặc Đã xác nhận
            if (booking.bookingStatus !== 'Pending Deposit' && booking.bookingStatus !== 'Confirmed') {
                return res.redirect('/manage/quan_li_phieuthue?error=CannotCancel'); // Gửi lỗi về query string
            }

            // 3. Cập nhật trạng thái Booking thành 'Cancelled'
            booking.bookingStatus = 'Cancelled';
            await booking.save();

            if (booking.bookingStatus === 'Confirmed') { 
               await Room.findByIdAndUpdate(booking.room, { status: 'Trống' });
            }

            // 5. Chuyển hướng về trang danh sách với thông báo thành công
            res.redirect('/manage/quan_li_phieuthue?success=BookingCancelled');

        } catch (error) {
            console.error('Lỗi khi hủy phiếu thuê:', error);
            res.redirect('/manage/quan_li_phieuthue?error=ServerError'); // Báo lỗi chung
            next(error); // Tùy chọn
        }
    }
}

module.exports = new BookingController();