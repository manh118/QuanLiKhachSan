const express = require('express')
const router = express.Router()

const GioiThieuController = require('../app/controllers/GioithieuController')

router.get('/', GioiThieuController.index)

module.exports = router