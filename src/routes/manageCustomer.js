const express = require('express');
const router = express.Router();
const ManageCustomerController = require('../app/controllers/ManageCustomerController');

// Các route quản lý
router.get('/:id/update', ManageCustomerController.showUpdateCustomer);
router.put('/:id/update', ManageCustomerController.updateCustomer);

module.exports = router;
