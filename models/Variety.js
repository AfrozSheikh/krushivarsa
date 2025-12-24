const mongoose = require('mongoose');

const varietySchema = new mongoose.Schema({
    crop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide variety name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['traditional_landrace', 'improved_variety', 'hybrid', 'wild_relative'],
        required: true
    },
    germplasmType: {
        type: String,
        enum: ['traditional_landraces', 'improved_varieties', 'hybrids', 'wild_relatives'],
        required: true
    },
    contributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        village: String,
        district: String,
        state: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contactNumber: String,
    specialCharacteristics: [String],
    notes: String,
    detailedDescription: String,
    image: String,
    threatLevel: {
        type: String,
        enum: ['critically_endangered', 'endangered', 'vulnerable', 'not_threatened'],
        default: 'not_threatened'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationDate: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for search
varietySchema.index({ name: 'text', specialCharacteristics: 'text', notes: 'text' });

module.exports = mongoose.model('Variety', varietySchema);