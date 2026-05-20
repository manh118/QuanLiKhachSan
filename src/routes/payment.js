const express = require('express');
const router = express.Router();
const PaymentController = require('../app/controllers/PaymentController');

router.post('/create_payment_url', PaymentController.createPaymentUrl);
router.get('/vnpay_return', PaymentController.vnpayReturn);
router.get('/vnpay_ipn', PaymentController.vnpayIpn);

module.exports = router;
