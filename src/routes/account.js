const express = require('express')
const router = express.Router()

const accountController = require('../app/controllers/AccountController')
const authCustomer = require('../middleware/authCustomer');

router.post('/login', accountController.login)
router.get('/login', accountController.showLogin)
router.get('/regis', accountController.showRegis)
router.post('/regis', accountController.regis)
router.get('/bookings', authCustomer,accountController.showMyBookings)
router.get('/logout', accountController.logout)

module.exports = router