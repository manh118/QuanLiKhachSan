const express = require('express');
const router = express.Router();
const manageServiceController = require('../app/controllers/ManageServiceController');
const uploadTo = require('../middleware/upload');
const uploadService = uploadTo('service');

// Các route quản lý
router.get('/show_create', manageServiceController.showServiceRoom);
router.post('/create',manageServiceController.CreateService);
router.get('/:id/show_update', manageServiceController.showUpdate);
router.put('/:id/update', manageServiceController.update);
router.delete('/:id/delete', manageServiceController.delete);
router.put('/:id/toggle-status', manageServiceController.toggleStatus);


module.exports = router;
