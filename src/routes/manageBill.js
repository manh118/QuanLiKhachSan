const express = require('express');
const router = express.Router();
const ManageBillController = require('../app/controllers/ManageBillControllers');


// Các route quản lý
router.post('/create',ManageBillController.CreateBill);
router.delete('/:id/delete', ManageBillController.delete);

module.exports = router;
