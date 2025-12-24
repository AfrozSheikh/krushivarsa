const User = require('../models/User');

exports.getPendingRegistrations = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            role: { $in: ['farmer', 'institution'] },
            status: 'pending'
        }).select('-password');

        res.json({
            success: true,
            count: pendingUsers.length,
            users: pendingUsers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify admin user'
            });
        }

        user.status = action === 'approve' ? 'approved' : 'rejected';
        user.isApproved = action === 'approve';
        await user.save();

        res.json({
            success: true,
            message: `User ${action}d successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        const query = { role: { $ne: 'admin' } };

        if (role) query.role = role;
        if (status) query.status = status;

        const users = await User.find(query).select('-password');

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};