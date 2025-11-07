// routes/manageDiscount.js
const express = require('express');
const router = express.Router();
const manageDiscountController = require('../app/controllers/ManageDiscountController');

router.get('/create', manageDiscountController.showCreateDiscount);
router.post('/create', manageDiscountController.createDiscount);
router.get('/edit', manageDiscountController.createDiscount);
router.put('/update', manageDiscountController.createDiscount);
router.delete('/:id', manageDiscountController.deleteDiscount); // Route để xóa

// Thêm route GET /:id/edit và PUT /:id/update nếu bạn làm chức năng sửa

module.exports = router;