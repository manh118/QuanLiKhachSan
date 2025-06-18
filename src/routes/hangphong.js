const express = require('express')
const router = express.Router()

const HangphongController = require('../app/controllers/HangphongController')

router.get('/:id/rooms', HangphongController.DanhSachTuongUng)
router.get('/room/:roomNumber', HangphongController.ShowDetail)
router.get('/', HangphongController.Hienthi)

module.exports = router