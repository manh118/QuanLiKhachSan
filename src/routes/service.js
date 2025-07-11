const express = require('express')
const router = express.Router()

const ServiceController = require('../app/controllers/ServiceController')

// router.get('/:id/rooms', HangphongController.DanhSachTuongUng)
// router.get('/room/:roomNumber', HangphongController.ShowDetail)
router.get('/tiec', ServiceController.Hienthi1)
router.get('/amthuc', ServiceController.amthuc)

module.exports = router