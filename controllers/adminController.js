const Crop = require('../models/Crop');
const Variety = require('../models/Variety');
const User = require('../models/User');
const Notice = require('../models/Notice');
const { getDashboardStats } = require('../utils/helpers');

exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await getDashboardStats(Crop, Variety, User);
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.createNotice = async (req, res) => {
    try {
        const { title, content, expiresAt } = req.body;

        const notice = await Notice.create({
            title,
            content,
            createdBy: req.user.id,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        res.status(201).json({
            success: true,
            notice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getAllNotices = async (req, res) => {
    try {
        const { active } = req.query;
        const query = {};

        if (active === 'true') {
            query.isActive = true;
            query.$or = [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ];
        }

        const notices = await Notice.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: notices.length,
            notices
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateNotice = async (req, res) => {
    try {
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        res.json({
            success: true,
            notice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({
                success: false,
                message: 'Notice not found'
            });
        }

        await notice.deleteOne();

        res.json({
            success: true,
            message: 'Notice deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};