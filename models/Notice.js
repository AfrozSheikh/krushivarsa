const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide notice title'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please provide notice content']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: Date
});

module.exports = mongoose.model('Notice', noticeSchema);