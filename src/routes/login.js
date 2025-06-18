const express = require('express')
const router = express.Router()

const loginController = require('../app/controllers/LoginController')

router.post('/', loginController.login)
router.get('/', loginController.index)

module.exports = router