const moment = require('moment');
const crypto = require('crypto');
const config = require('../../config/vnpay');
const Booking = require('../models/Booking');
const { sendEmail } = require('../../utils/emailService');

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

class PaymentController {

    // [POST] /payment/create_payment_url
    createPaymentUrl(req, res, next) {
        process.env.TZ = 'Asia/Ho_Chi_Minh';
        
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');
        
        let ipAddr = req.headers['x-forwarded-for'] || 
            req.connection.remoteAddress || 
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        let tmnCode = config.vnp_TmnCode;
        let secretKey = config.vnp_HashSecret;
        let vnpUrl = config.vnp_Url;
        let returnUrl = config.vnp_ReturnUrl;

        // VNPAY yêu cầu vnp_TxnRef phải là DUY NHẤT cho mỗi lần tạo url thanh toán
        let paymentType = req.body.paymentType || 'deposit';
        let orderId = req.body.bookingId ? req.body.bookingId + '_' + paymentType + '_' + moment(date).format('HHmmss') : moment(date).format('DDHHmmss');
        
        let amount = req.body.amount;
        let bankCode = req.body.bankCode || ''; // Tùy chọn, vd: VNBANK, INTCARD
        let locale = req.body.language || 'vn';

        let currCode = 'VND';
        let vnp_Params = {};
        
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        
        if (paymentType === 'checkout') {
            vnp_Params['vnp_OrderInfo'] = 'Thanh toan phan con lai: ' + orderId;
        } else {
            vnp_Params['vnp_OrderInfo'] = 'Thanh toan dat coc cho don dat phong: ' + orderId;
        }
        
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        if (bankCode !== null && bankCode !== '') {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
        
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        res.json({code: '00', data: vnpUrl});
    }

    // [GET] /payment/vnpay_return
    async vnpayReturn(req, res, next) {
        let vnp_Params = req.query;

        let secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        let config = require('../../config/vnpay');
        let secretKey = config.vnp_HashSecret;

        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

        let isSuccess = false;
        let txnRefParts = vnp_Params['vnp_TxnRef'].split('_');
        let actualOrderId = txnRefParts[0];
        let paymentType = txnRefParts[1];

        if (secureHash === signed) {
            // Kiểm tra xem dữ liệu có hợp lệ không
            if (vnp_Params['vnp_ResponseCode'] == '00') {
                isSuccess = true;
                
                // VÌ ĐANG CHẠY LOCALHOST NÊN VNPAY KHÔNG THỂ GỌI ĐƯỢC IPN
                // DO ĐÓ CHÚNG TA CẬP NHẬT DATABASE LUÔN TẠI ĐÂY ĐỂ DEMO ĐỒ ÁN
                try {
                    const booking = await Booking.findById(actualOrderId);
                    if (booking) {
                        if (paymentType === 'checkout' && booking.bookingStatus === 'Checked In') {
                            // Cập nhật trạng thái thành Checked Out
                            booking.bookingStatus = 'Checked Out';
                            await booking.save();
                        } else if (booking.bookingStatus === 'Pending Deposit') {
                            booking.bookingStatus = 'Confirmed';
                            await booking.save();
                            
                            // GỬI EMAIL THÔNG BÁO ĐẶT PHÒNG THÀNH CÔNG
                            if (booking.customer && booking.customer.email) {
                                const shortCode = booking._id.toString().slice(-6).toUpperCase();
                                const emailSubject = `[20Hotel] Xác nhận Đặt phòng Thành công - Mã phiếu: ${shortCode}`;
                                const emailHtml = `
                                    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7f6; color: #333;">
                                        <div style="max-width: 600px; margin: 0 auto; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                            <div style="background-color: #28a745; padding: 20px; text-align: center; color: #fff;">
                                                <h1 style="margin: 0; font-size: 24px;">Xác nhận Đặt phòng Thành công!</h1>
                                            </div>
                                            <div style="padding: 30px;">
                                                <p style="font-size: 16px;">Kính chào <strong>${booking.customer.fullName}</strong>,</p>
                                                <p style="font-size: 16px; line-height: 1.5;">Cảm ơn quý khách đã tin tưởng và lựa chọn <strong>20Hotel</strong>. Chúng tôi xin xác nhận quý khách đã thanh toán tiền cọc thành công.</p>
                                                
                                                <h3 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Thông tin Đặt phòng</h3>
                                                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555; width: 40%;">Mã phiếu thuê:</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; font-size: 18px; color: #007bff;">${shortCode}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">Số điện thoại:</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${booking.customer.phone}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">Phòng:</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; color: #007bff;">${booking.roomNumber}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">Ngày nhận phòng:</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${moment(booking.checkInDate).format('DD/MM/YYYY HH:mm')}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">Ngày trả phòng:</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${moment(booking.checkOutDate).format('DD/MM/YYYY HH:mm')}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">Tổng tiền phòng:</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right;">${booking.totalAmount.toLocaleString('vi-VN')} VNĐ</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #555;">Đã cọc (VNPay):</td>
                                                        <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; text-align: right; color: #28a745;">${booking.depositAmount.toLocaleString('vi-VN')} VNĐ</td>
                                                    </tr>
                                                </table>
                                                
                                                <p style="font-size: 16px; line-height: 1.5; margin-top: 30px;">Quý khách vui lòng lưu lại mã phiếu thuê này để cung cấp cho Lễ tân khi tới nhận phòng.</p>
                                                <p style="font-size: 16px; margin-top: 30px; font-style: italic; color: #7f8c8d;">Trân trọng,<br>Ban Quản Lý 20Hotel</p>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                
                                // Gửi email bất đồng bộ (không làm chậm quá trình return)
                                sendEmail(booking.customer.email, emailSubject, emailHtml);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Lỗi cập nhật DB ở Return:', err);
                }
            }
        }

        res.render('payment/vnpay_return', {
            isSuccess: isSuccess,
            orderId: actualOrderId,
            amount: vnp_Params['vnp_Amount'] / 100,
            orderInfo: vnp_Params['vnp_OrderInfo'],
            layout: 'main'
        });
    }

    // [GET] /payment/vnpay_ipn
    async vnpayIpn(req, res, next) {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        let orderId = vnp_Params['vnp_TxnRef'].split('_')[0];
        let rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        let secretKey = config.vnp_HashSecret;
        let querystring = require('qs');
        let signData = querystring.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
        
        let paymentStatus = '0'; // Giả sử '0' là chưa thanh toán

        if (secureHash === signed) {
            try {
                // Lấy đơn hàng từ DB
                const booking = await Booking.findById(orderId);
                
                if (!booking) {
                    return res.status(200).json({RspCode: '01', Message: 'Order not found'});
                }
                
                // Kiểm tra số tiền
                let checkAmount = booking.depositAmount * 100 == vnp_Params['vnp_Amount'];
                if (!checkAmount) {
                    return res.status(200).json({RspCode: '04', Message: 'Invalid amount'});
                }
                
                // Kiểm tra trạng thái đơn hàng
                if (booking.bookingStatus !== 'Pending Deposit') {
                    return res.status(200).json({RspCode: '02', Message: 'Order already confirmed'});
                }
                
                // Cập nhật DB
                if (rspCode == '00') {
                    // Thanh toán thành công
                    booking.bookingStatus = 'Confirmed';
                    await booking.save();
                } else {
                    // Giao dịch thất bại
                    // Có thể giữ nguyên Pending Deposit hoặc chuyển thành Cancelled
                }
                
                res.status(200).json({RspCode: '00', Message: 'Confirm Success'});
            } catch (err) {
                console.error('Lỗi IPN:', err);
                res.status(200).json({RspCode: '99', Message: 'Unknown error'});
            }
        } else {
            res.status(200).json({RspCode: '97', Message: 'Fail checksum'});
        }
    }
}

module.exports = new PaymentController();
