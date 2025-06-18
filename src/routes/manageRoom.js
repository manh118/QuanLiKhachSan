const express = require('express');
const router = express.Router();
const manageRoomController = require('../app/controllers/ManageRoomController');
const uploadTo = require('../middleware/upload');
const uploadRoom = uploadTo('Room');

// Các route quản lý
router.get('/show_create', manageRoomController.showCreateRoom);
router.post('/create',uploadRoom.single('img'),manageRoomController.CreateRoom);
// router.post('/create', uploadRoom.array('img', 10), manageRoomController.CreateRoom);
router.get('/:id/show_update', manageRoomController.showUpdate);
router.put('/:id/update', manageRoomController.update);
router.delete('/:id/delete', manageRoomController.delete)


module.exports = router;
