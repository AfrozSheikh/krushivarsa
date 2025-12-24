const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide crop name'],
        unique: true,
        trim: true
    },
    scientificName: String,
    description: String,
    category: {
        type: String,
        enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'spice', 'other'],
        default: 'other'
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    varieties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Variety'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Crop', cropSchema);