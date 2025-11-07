const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User'); 
const Service = require('../models/Service');

const SURCHARGE_PER_EXTRA_ADULT = 100000;
const STANDARD_CHECKOUT_HOUR = 12; 
const LATE_CHECKOUT_FEE_PER_HOUR = 100000;

class BookingController {

  // Tạo booking
  async createBooking(req, res, next) {
    const {
      roomId, checkInDate, checkOutDate,
      nguoiLon, treEm, fullName, phone, email, services,source
    } = req.body;

    const numNguoiLon = parseInt(nguoiLon, 10) || 1;
    const numTreEm = parseInt(treEm, 10) || 0;

    try {

      const room = await Room.findById(roomId).populate('roomType');
      if (!room) {
        return res.status(404).json({ message: 'Không tìm thấy phòng' });
      }

      const roomType = room.roomType;

      if (numNguoiLon <= 0) {
           return res.status(400).json({ message: 'Phải có ít nhất 1 người lớn.' });
      }

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const soNgay = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      if (soNgay <= 0) { return res.status(400).json({ message: 'Ngày trả phòng phải sau ngày nhận phòng.' }); }
      const roomPrice = room.roomType.price;
      const totalRoomCost = soNgay * roomPrice;
      const roomNumber = room.roomNumber;
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
      
      const numExtraAdults = Math.max(0, numNguoiLon - roomType.maxAdults); // Vẫn giữ lại tính toán này
      const totalExtraAdultSurcharge = numExtraAdults * SURCHARGE_PER_EXTRA_ADULT * soNgay;

      const totalAmount = totalRoomCost + totalServiceCost + totalExtraAdultSurcharge;
      const depositAmount = Math.round(totalAmount / 4); // Cọc 50%
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
        nguoiLon: numNguoiLon,
        treEm: numTreEm,
        roomPrice,
        totalRoomCost,
        customer: { fullName, phone, email }, 
        services: serviceDetails,
        totalServiceCost: totalServiceCost,
        extraAdultSurcharge: totalExtraAdultSurcharge,
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

  // Xác nhận cọc
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
            booking.actualCheckInTime = new Date();
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
            if (booking.bookingStatus !== 'Checked In') {
                return res.status(400).json({ message: 'Phiếu thuê không ở trạng thái Check In' });
            }

            // === BẮT ĐẦU: TÍNH PHÍ TRẢ PHÒNG MUỘN ===
            const actualCheckOutTime = moment(); // Lấy thời gian thực tế KHI NHẤN NÚT
            
            const standardCheckOutTime = moment(booking.checkOutDate) // Lấy ngày trả phòng dự kiến
                                        .hour(STANDARD_CHECKOUT_HOUR) // Đặt giờ
                                        .minute(0)                    // Đặt phút
                                        .second(0);                   // Đặt giây

            let lateCheckOutFee = 0;
            let hoursLate = 0;

            // So sánh thời gian trả phòng thực tế với mốc tiêu chuẩn
            if (actualCheckOutTime.isAfter(standardCheckOutTime)) {
                // Tính số giờ bị muộn (làm tròn LÊN)
                // Ví dụ: muộn 15 phút (0.25 giờ) cũng tính là 1 giờ
                const durationLate = moment.duration(actualCheckOutTime.diff(standardCheckOutTime));
                hoursLate = Math.ceil(durationLate.asHours()); 

                if (hoursLate > 0) {
                    lateCheckOutFee = hoursLate * LATE_CHECKOUT_FEE_PER_HOUR;
                }
            }
            // === KẾT THÚC: TÍNH PHÍ TRẢ PHÒNG MUỘN ===

            // 2. Cập nhật trạng thái và các giá trị mới vào Booking
            booking.bookingStatus = 'Checked Out';
            booking.actualCheckOutTime = actualCheckOutTime.toDate(); // Lưu thời gian checkout thực tế
            
            // Cập nhật lại tổng tiền (thêm phí trả phòng muộn)
            // (Kiểm tra xem đã tính chưa để tránh cộng dồn nếu checkout nhiều lần)
            if (booking.lateCheckOutFee === 0 && lateCheckOutFee > 0) {
                 booking.lateCheckOutFee = lateCheckOutFee;
                 booking.totalAmount += lateCheckOutFee;
                 booking.remainingAmount += lateCheckOutFee; // Cộng vào số tiền còn lại phải thanh toán
            }
            
            await booking.save();

            // 3. Cập nhật trạng thái Room thành 'Dọn dẹp'
            await Room.findByIdAndUpdate(booking.room, { status: 'Dọn dẹp' });

            // 4. Trả về thành công
            res.json({ 
                message: 'success',
                // (Tùy chọn) Gửi lại thông tin đã cập nhật để modal hiển thị nếu cần
                updatedBooking: {
                    totalAmount: booking.totalAmount,
                    remainingAmount: booking.remainingAmount,
                    lateCheckOutFee: booking.lateCheckOutFee,
                    hoursLate: hoursLate
                }
            });

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
            const originalStatus = booking.bookingStatus;
            // 3. Cập nhật trạng thái Booking thành 'Cancelled'
            booking.bookingStatus = 'Cancelled';
            await booking.save();

            if (originalStatus === 'Confirmed') { // <-- KIỂM TRA TRẠNG THÁI GỐC
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

    async showUpdateBooking(req, res, next) {
        try {
            const bookingId = req.params.id;
            // Lấy thông tin booking cần sửa VÀ danh sách TẤT CẢ dịch vụ
            const [booking, allActiveServices] = await Promise.all([
                Booking.findById(bookingId).populate('services.service').lean(), // Populate để lấy tên service
                Service.find({isActive: true}).lean()
            ]);

            if (!booking) {
                return res.status(404).send('Không tìm thấy phiếu thuê');
            }

            // Tạo một đối tượng map để dễ dàng kiểm tra dịch vụ nào đã được chọn trong view
            const selectedServicesMap = {};
            if (booking.services) {
                booking.services.forEach(item => {
                    // Cần kiểm tra item.service có tồn tại không trước khi truy cập _id
                    if (item.service && item.service._id) {
                         selectedServicesMap[item.service._id.toString()] = item.quantity;
                    } else {
                         console.warn(`Booking ${bookingId} có service item không hợp lệ:`, item);
                    }
                });
            }


            res.render('manage/quan_li_phieuthue_update', {
                booking,
                allServices: allActiveServices,
                selectedServicesMap // Truyền map này ra view
            });

        } catch (error) {
            next(error);
        }
    }

      async updateBooking(req, res, next) {
        const bookingId = req.params.id;
        const updatedData = req.body; // Dữ liệu từ form (bao gồm cả services mới)

        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu thuê' });
            }

            // 1. Cập nhật thông tin cơ bản (Ngày, Khách hàng)
            booking.checkInDate = updatedData.checkInDate;
            booking.checkOutDate = updatedData.checkOutDate;
            booking.customer = {
                fullName: updatedData.fullName,
                phone: updatedData.phone,
                email: updatedData.email
            };
            // Cập nhật nguoiLon, treEm nếu bạn thêm lại vào form
             booking.nguoiLon = updatedData.nguoiLon || booking.nguoiLon; // Giữ giá trị cũ nếu không có
             booking.treEm = updatedData.treEm || booking.treEm;

            // 2. Tính toán lại số ngày và tiền phòng
            const checkIn = new Date(updatedData.checkInDate);
            const checkOut = new Date(updatedData.checkOutDate);
            booking.soNgay = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            // Giả sử giá phòng không đổi khi cập nhật booking
            booking.totalRoomCost = booking.soNgay * booking.roomPrice;

            // 3. Xử lý và tính toán lại dịch vụ
            let newTotalServiceCost = 0;
            const newServiceDetails = [];
            if (updatedData.services && Array.isArray(updatedData.services)) {
                 updatedData.services.forEach(s => {
                    const quantity = parseInt(s.quantity, 10) || 0;
                    const price = parseFloat(s.price) || 0; // Lấy giá gửi từ client
                    if (quantity > 0) {
                        newTotalServiceCost += quantity * price;
                        newServiceDetails.push({
                            service: s.id, // ID của service
                            quantity: quantity,
                            price: price // Lưu lại giá tại thời điểm đó
                        });
                    }
                });
            }
             booking.services = newServiceDetails;
             booking.totalServiceCost = newTotalServiceCost;


            // 4. Tính toán lại tổng tiền và số tiền còn lại
            booking.totalAmount = booking.totalRoomCost + booking.totalServiceCost;
            // Tiền cọc giữ nguyên như ban đầu
            booking.remainingAmount = booking.totalAmount - booking.depositAmount;

            // 5. Lưu lại thay đổi
            await booking.save();

            res.json({ success: true, message: 'Cập nhật phiếu thuê thành công!' });

        } catch (error) {
            console.error('Lỗi khi cập nhật phiếu thuê:', error);
            res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
            next(error);
        }
    }
}

module.exports = new BookingController();