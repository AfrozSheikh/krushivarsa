const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/role');
const { cropValidation } = require('../utils/validators');
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
router.get('/', cropController.getAllCrops);
router.get('/:id', cropController.getCropById);

// Admin only routes
router.post('/', protect, authorize('admin'), validate(cropValidation), cropController.createCrop);
router.put('/:id', protect, authorize('admin'), cropController.updateCrop);
router.delete('/:id', protect, authorize('admin'), cropController.deleteCrop);

module.exports = router;