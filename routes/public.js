const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public access routes (no authentication required)
router.get('/crops', publicController.getAllPublicCrops);
router.get('/varieties', publicController.getAllPublicVarieties);
router.get('/varieties/:id', publicController.getPublicVarietyById);
router.get('/notices', publicController.getActiveNotices);
router.get('/statistics', publicController.getStatistics);

module.exports = router;