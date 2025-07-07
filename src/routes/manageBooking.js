const express = require('express')
const router = express.Router()

const BookingController = require('../app/controllers/BookingController')

router.delete('/:id/delete', BookingController.delete)

module.exports = router