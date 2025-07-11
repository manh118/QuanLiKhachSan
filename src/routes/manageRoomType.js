const express = require('express');
const router = express.Router();
const manageRoomTypeController = require('../app/controllers/ManageRoomTypeController');
const uploadTo = require('../middleware/upload');
const uploadRoom = uploadTo('Room');

// Các route quản lý
router.get('/show_create', manageRoomTypeController.showCreateRoomType);
router.post('/create',uploadRoom.single('img'),manageRoomTypeController.CreateRoomType);
router.get('/:id/show_update', manageRoomTypeController.showUpdateRoomType);
router.put('/:id/update', manageRoomTypeController.updateRoomType);
router.delete('/:id/delete', manageRoomTypeController.deleteRoomType)


module.exports = router;
