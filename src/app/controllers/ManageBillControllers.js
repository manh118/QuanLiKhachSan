const Bill = require('../models/Bill')
const Booking = require('../models/Booking');

class ManageBillController {

  // Tự động tạo mã hóa đơn
  async getNextBillId(req, res, next) {
        try {
            // 1. Tìm hóa đơn cuối cùng được tạo bằng cách sắp xếp theo trường createdAt giảm dần
            const lastBill = await Bill.findOne().sort({ createdAt: -1 });

            let nextIdNumber = 1; // Mặc định là 1 nếu chưa có hóa đơn nào

            if (lastBill && lastBill.idBill) {
                // 2. Nếu có hóa đơn, tách số ra khỏi chuỗi 'HD'
                // Ví dụ: 'HD2' -> '2' -> 2
                const lastIdNumber = parseInt(lastBill.idBill.replace('HD', ''), 10);
                nextIdNumber = lastIdNumber + 1;
            }

            // 3. Tạo mã hóa đơn mới và trả về dưới dạng JSON
            const nextBillId = `HD${nextIdNumber}`;
            res.json({ nextBillId: nextBillId });

        } catch (error) {
            console.error('Lỗi khi lấy mã hóa đơn tiếp theo:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
  }

  // Tạo mới hóa đơn
  async CreateBill(req, res, next) {
        // Client chỉ cần gửi lên idBill và bookingId
        const { idBill, bookingId } = req.body;

        try {
            // 1. Dùng bookingId để tìm phiếu thuê gốc
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                return res.status(404).json({ message: 'Không tìm thấy phiếu thuê tương ứng.' });
            }

            // 2. Tạo đối tượng hóa đơn mới từ thông tin của phiếu thuê
            const newBill = new Bill({
                idBill: idBill,
                booking: booking._id,
                customerName: booking.customer.fullName,
                phone: booking.customer.phone,
                roomNumber: booking.roomNumber,
                checkIn: booking.checkInDate,
                checkOut: booking.checkOutDate,
                totalAmount: booking.totalAmount,     
                depositAmount: booking.depositAmount, 
                amountPaid: booking.remainingAmount,  
            });

            // 3. Lưu hóa đơn vào DB
            await newBill.save();
            
            // 4. Trả về thành công
            res.json({ message: 'success' });

        } catch (error) {
            console.error('Lỗi khi tạo hóa đơn:', error);
            // Gửi lại lỗi validation nếu có
            if (error.name === 'ValidationError') {
                return res.status(400).json({ message: 'Validation failed', errors: error.errors });
            }
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

  delete(req, res, next) {
      Bill.deleteOne({ _id: req.params.id})
        .then(() => {
          res.redirect('/manage/quan_li_hoadon');
          
        })
        .catch(next)
  }


}

module.exports = new ManageBillController()
