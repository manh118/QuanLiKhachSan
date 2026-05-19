const express = require('express');
const router = express.Router();
const chatbotController = require('../app/controllers/ChatbotController');

router.post('/', chatbotController.chat);

module.exports = router;
