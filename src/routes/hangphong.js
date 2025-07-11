const express = require('express')
const router = express.Router()

const HangphongController = require('../app/controllers/HangphongController')

router.get('/:id/rooms', HangphongController.DS_HangPhong_TuongUng)
router.get('/room/:roomNumber', HangphongController.Chi_Tiet_Phong)
router.get('/', HangphongController.Hienthi)

module.exports = router