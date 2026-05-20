const express = require('express')
const router = express.Router()

const BookingController = require('../app/controllers/BookingController')

router.post('/', BookingController.createBooking)
router.post('/calculate-price', BookingController.calculatePrice)

module.exports = router