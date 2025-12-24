const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { formatUser } = require('../utils/helpers');

exports.register = async (req, res) => {
    try {
        const { name, email, password, contactNumber, role, userType, location } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            contactNumber,
            role: role || 'farmer',
            userType: userType || (role === 'institution' ? 'public' : 'farmer'),
            location,
            isApproved: role === 'admin', // Only admin is auto-approved
            status: role === 'admin' ? 'approved' : 'pending'
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Waiting for admin approval.',
            token,
            user: formatUser(user)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(email , password);
        

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'user not found'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentialsssss'
            });
        }

        // Check if user is approved (except admin)
        if (user.role !== 'admin' && (!user.isApproved || user.status !== 'approved')) {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending approval'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: formatUser(user)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('contributedVarieties', 'name type crop createdAt')
            .populate({
                path: 'contributedVarieties',
                populate: {
                    path: 'crop',
                    select: 'name'
                }
            });

        res.json({
            success: true,
            user: formatUser(user),
            contributedVarieties: user.contributedVarieties
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updates = {};
        const allowedUpdates = ['name', 'contactNumber', 'location'];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            user: formatUser(user)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};