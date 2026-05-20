require('dotenv').config();

module.exports = {
    vnp_TmnCode: process.env.VNP_TMN_CODE, 
    vnp_HashSecret: process.env.VNP_HASH_SECRET, 
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
    vnp_ReturnUrl: "http://localhost:3000/payment/vnpay_return"
};
