const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/role');
const { noticeValidation } = require('../utils/validators');
const { validationResult } = require('express-validator');

const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            errors: errors.array()
        });
    };
};

// Admin only routes
router.get('/dashboard/stats', protect, authorize('admin'), adminController.getDashboardStats);
router.post('/notices', protect, authorize('admin'), validate(noticeValidation), adminController.createNotice);
router.get('/notices', protect, authorize('admin'), adminController.getAllNotices);
router.put('/notices/:id', protect, authorize('admin'), adminController.updateNotice);
router.delete('/notices/:id', protect, authorize('admin'), adminController.deleteNotice);

module.exports = router;