const { body } = require('express-validator');

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('contactNumber').notEmpty().withMessage('Contact number is required'),
    body('role').isIn(['farmer', 'institution']).withMessage('Invalid role'),
    body('userType').custom((value, { req }) => {
        if (req.body.role === 'farmer' && value !== 'farmer') {
            throw new Error('User type must be farmer for farmer role');
        }
        if (req.body.role === 'institution' && !['public', 'private', 'ngo', 'seed_bank'].includes(value)) {
            throw new Error('Invalid institution type');
        }
        return true;
    })
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

const cropValidation = [
    body('name').notEmpty().withMessage('Crop name is required'),
    body('category').isIn(['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'spice', 'other'])
        .withMessage('Invalid crop category')
];

const varietyValidation = [
    body('crop').notEmpty().withMessage('Crop is required'),
    body('name').notEmpty().withMessage('Variety name is required'),
    body('type').isIn(['traditional_landrace', 'improved_variety', 'hybrid', 'wild_relative'])
        .withMessage('Invalid variety type'),
    body('germplasmType').isIn(['traditional_landraces', 'improved_varieties', 'hybrids', 'wild_relatives'])
        .withMessage('Invalid germplasm type'),
    body('threatLevel').isIn(['critically_endangered', 'endangered', 'vulnerable', 'not_threatened'])
        .withMessage('Invalid threat level')
];

const noticeValidation = [
    body('title').notEmpty().withMessage('Notice title is required'),
    body('content').notEmpty().withMessage('Notice content is required')
];

module.exports = {
    registerValidation,
    loginValidation,
    cropValidation,
    varietyValidation,
    noticeValidation
};