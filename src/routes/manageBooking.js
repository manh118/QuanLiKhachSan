const express = require('express')
const router = express.Router()

const BookingController = require('../app/controllers/BookingController')

// router.delete('/:id/delete', BookingController.delete)
router.post('/:id/confirm-deposit', BookingController.confirmDeposit);
router.post('/:id/check-in', BookingController.checkIn);
router.post('/:id/checkout', BookingController.checkOut);
router.put('/:id/cancel', BookingController.cancelBooking);

module.exports = router