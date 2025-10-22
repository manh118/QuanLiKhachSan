// app/controllers/ReportController.js
const Bill = require('../models/Bill');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const moment = require('moment'); // Cài đặt: npm install moment

class ReportController {

    async showReports(req, res, next) {
        try {
            // 1. Xác định khoảng thời gian
            let endDate, startDate;

            if (req.query.endDate && req.query.endDate.trim() !== '' && moment(req.query.endDate).isValid()) {
                endDate = moment(req.query.endDate).endOf('day');
            } else {
                endDate = moment().endOf('month').endOf('day');
            }

            if (req.query.startDate && req.query.startDate.trim() !== '' && moment(req.query.startDate).isValid()) {
                startDate = moment(req.query.startDate).startOf('day');
            } else {
                startDate = moment().startOf('month').startOf('day');
            }

            const dateRangeQuery = { 
                createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
            };

            // 2. Báo cáo Doanh thu (Hóa đơn)
            const revenueReport = await Bill.aggregate([
                { $match: { paymentDate: { $gte: startDate.toDate(), $lte: endDate.toDate() } } },
                { $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalBills: { $sum: 1 }
                }}
            ]);

            // 3. Báo cáo Công suất phòng (Booking)
            const totalRooms = await Room.countDocuments();
            const numDays = endDate.diff(startDate, 'days') + 1;
            const totalPossibleNights = totalRooms * numDays;

            const occupancyReport = await Booking.aggregate([
                { $match: {
                    bookingStatus: { $in: ['Checked In', 'Checked Out'] },
                    checkInDate: { $lte: endDate.toDate() },
                    checkOutDate: { $gte: startDate.toDate() }
                }},
                { $group: {
                    _id: null,
                    totalNightsBooked: { $sum: "$soNgay" }
                }}
            ]);

            // 4. Báo cáo Nguồn đặt phòng (Booking)
            const websiteBookings = await Booking.countDocuments({
                ...dateRangeQuery,
                source: 'website'
            });
            const manualBookings = await Booking.countDocuments({
                ...dateRangeQuery,
                source: 'manual'
            });

            // 5. Chuẩn bị dữ liệu gửi ra view
            const reports = {
                totalRevenue: revenueReport[0]?.totalRevenue || 0,
                totalBills: revenueReport[0]?.totalBills || 0,
                totalNightsBooked: occupancyReport[0]?.totalNightsBooked || 0,
                occupancyRate: totalPossibleNights > 0 ? (occupancyReport[0]?.totalNightsBooked || 0) / totalPossibleNights * 100 : 0,
                websiteBookings: websiteBookings,
                manualBookings: manualBookings,
                startDate: startDate.format('YYYY-MM-DD'), 
                endDate: endDate.format('YYYY-MM-DD')     
            };

            res.render('manage/reports', reports);

        } catch (error) {
            console.error('Lỗi khi tạo báo cáo:', error);
            next(error);
        }
    }
}

module.exports = new ReportController();