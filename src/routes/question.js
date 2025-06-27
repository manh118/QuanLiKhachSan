const express = require('express')
const router = express.Router()

const QuestionController = require('../app/controllers/QuestionController')

router.get('/', QuestionController.Show)

module.exports = router