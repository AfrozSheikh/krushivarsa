const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/role');

// Admin only routes
router.get('/pending', protect, authorize('admin'), userController.getPendingRegistrations);
router.put('/:userId/approve', protect, authorize('admin'), userController.approveUser);
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.delete('/:userId', protect, authorize('admin'), userController.deleteUser);

module.exports = router;