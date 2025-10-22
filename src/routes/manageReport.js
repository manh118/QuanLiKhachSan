const express = require('express');
const router = express.Router();
const reportController = require('../app/controllers/ManageReportController');

// Route chính cho trang báo cáo
router.get('/', reportController.showReports);

module.exports = router;