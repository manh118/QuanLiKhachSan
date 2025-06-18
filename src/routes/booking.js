const express = require('express')
const router = express.Router()

const BookingController = require('../app/controllers/BookingController')

router.post('/', BookingController.createBooking)

module.exports = router