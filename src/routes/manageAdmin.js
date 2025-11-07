const express = require('express');
const router = express.Router();
const manageAdminController = require('../app/controllers/ManageAdminController');


router.get('/showCreate', manageAdminController.showCreateForm);
router.post('/create', manageAdminController.store);
router.delete('/:id', manageAdminController.delete);

// TODO: Thêm các route cho edit/update nếu cần
// router.get('/:id/edit', manageAdminController.showEditForm);
// router.put('/:id', manageAdminController.update);

module.exports = router;