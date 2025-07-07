const Booking = require('../models/Booking');
const Room = require('../models/Room');

class BookingController {
  createBooking(req, res, next) {
    const {
      roomId, checkInDate, checkOutDate,
      nguoiLon, treEm, fullName, phone, email, services
    } = req.body;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const soNgay = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    Room.findById(roomId)
      .populate('roomType')
      .then(room => {
        if (!room) throw new Error('Không tìm thấy phòng');

        const roomPrice = room.roomType.price;
        const totalRoomCost = soNgay * roomPrice;
        const roomNumber = room.roomNumber; // ✅ lấy số phòng

        let totalServiceCost = 0;
        const serviceDetails = services
          .filter(s => s.quantity > 0)
          .map(s => {
            totalServiceCost += s.quantity * s.price;
            return {
              service: s.id,
              quantity: s.quantity,
              price: s.price
            };
          });

        const booking = new Booking({
          room: roomId,
          roomNumber, // ✅ lưu roomNumber vào booking
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
          totalAmount: totalRoomCost + totalServiceCost
        });

        return booking.save();
      })
      .then(savedBooking => {
      // ✅ cập nhật trạng thái phòng
      return Room.findByIdAndUpdate(
        roomId,
        { status: 'Đã đặt' }
        ).then(() => savedBooking);
      })
      .then(savedBooking => {
        res.status(201).json({ message: 'success', bookingId: savedBooking._id });
      })
      .catch(err => {
        console.error('Lỗi lưu booking:', err);
        res.status(500).json({ message: 'fail' });
      });
  }

   delete(req, res, next) {
      Booking.findByIdAndDelete(req.params.id)
      .then((deletedBooking) => {
      
        // Cập nhật trạng thái phòng
        return Room.findOneAndUpdate(
          { roomNumber: deletedBooking.roomNumber },
          { status: 'Trống' }
        );
      })
      .then(() => {
        res.redirect('/manage/quan_li_phieuthue');
      })
      .catch(next);
  }
}

module.exports = new BookingController();
