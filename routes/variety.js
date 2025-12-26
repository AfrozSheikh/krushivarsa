const express = require('express');
const router = express.Router();
const varietyController = require('../controllers/varietyController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/role');
const { validateImage } = require('../middleware/imageHandler'); // New middleware
const { varietyValidation } = require('../utils/validators');
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

// Public routes
router.get('/', varietyController.getAllVarieties);
router.get('/:id', varietyController.getVarietyById);

// Protected routes for authenticated users
router.get('/user/mine', protect, authorize('farmer', 'institution', 'admin'), varietyController.getUserVarieties);
router.post('/', protect, authorize('farmer', 'institution', 'admin'), validateImage, validate(varietyValidation), varietyController.createVariety); // Added validateImage middleware
router.put('/:id', protect, authorize('farmer', 'institution', 'admin'), validateImage, varietyController.updateVariety); // Added validateImage middleware
router.delete('/:id', protect, authorize('farmer', 'institution', 'admin'), varietyController.deleteVariety);

// Admin only routes
router.get('/admin/pending', protect, authorize('admin'), varietyController.getPendingVerifications);
router.put('/:id/verify', protect, authorize('admin'), varietyController.verifyVariety);

module.exports = router;