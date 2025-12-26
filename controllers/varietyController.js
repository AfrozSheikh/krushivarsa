const Variety = require('../models/Variety');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { formatVariety } = require('../utils/helpers');

exports.createVariety = async (req, res) => {
    try {
        const {
            crop,
            name,
            type,
            germplasmType,
            location,
            contactNumber,
            specialCharacteristics,
            notes,
            detailedDescription,
            threatLevel,
            image // Now expecting Base64 image data
        } = req.body;

        // Check if crop exists
        const cropExists = await Crop.findById(crop);
        if (!cropExists) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found'
            });
        }

        // Check user permissions based on role and type
        const user = req.user;
        
        if (user.role === 'farmer' && type !== 'traditional_landrace') {
            return res.status(403).json({
                success: false,
                message: 'Farmers can only add traditional landraces'
            });
        }

        if (user.role === 'institution') {
            if (!['improved_variety', 'hybrid'].includes(type)) {
                return res.status(403).json({
                    success: false,
                    message: 'Institutions can only add improved varieties or hybrids'
                });
            }
        }

        // Check if variety already exists for this crop
        const varietyExists = await Variety.findOne({ crop, name });
        if (varietyExists) {
            return res.status(400).json({
                success: false,
                message: 'Variety already exists for this crop'
            });
        }

        const varietyData = {
            crop,
            name,
            type,
            germplasmType,
            contributor: user.id,
            location: location || user.location,
            contactNumber: contactNumber || user.contactNumber,
            specialCharacteristics: specialCharacteristics ? 
                Array.isArray(specialCharacteristics) ? 
                    specialCharacteristics : 
                    specialCharacteristics.split(',').map(item => item.trim()) : 
                [],
            notes,
            detailedDescription,
            threatLevel,
            image: image || null, // Store the image object from middleware
            verificationStatus: user.role === 'admin' ? 'verified' : 'pending',
            isVerified: user.role === 'admin',
            verifiedBy: user.role === 'admin' ? user.id : null,
            verificationDate: user.role === 'admin' ? Date.now() : null
        };

        const variety = await Variety.create(varietyData);

        // Add variety to crop
        cropExists.varieties.push(variety._id);
        await cropExists.save();

        // Add variety to user's contributed varieties
        user.contributedVarieties.push(variety._id);
        await user.save();

        res.status(201).json({
            success: true,
            variety: formatVariety(variety)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ... (other functions remain the same, just remove file upload references)

exports.updateVariety = async (req, res) => {
    try {
        const variety = await Variety.findById(req.params.id);

        if (!variety) {
            return res.status(404).json({
                success: false,
                message: 'Variety not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && variety.contributor.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this variety'
            });
        }

        // Update fields
        const updates = req.body;
        if (updates.specialCharacteristics && typeof updates.specialCharacteristics === 'string') {
            updates.specialCharacteristics = updates.specialCharacteristics.split(',').map(item => item.trim());
        }

        // If admin is verifying
        if (req.user.role === 'admin' && updates.verificationStatus) {
            updates.isVerified = updates.verificationStatus === 'verified';
            updates.verifiedBy = req.user.id;
            updates.verificationDate = Date.now();
        }

        const updatedVariety = await Variety.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).populate('crop', 'name');

        res.json({
            success: true,
            variety: formatVariety(updatedVariety)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ... (other functions remain the same)

exports.getAllVarieties = async (req, res) => {
    try {
        const {
            crop,
            type,
            germplasmType,
            threatLevel,
            verified,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        if (crop) query.crop = crop;
        if (type) query.type = type;
        if (germplasmType) query.germplasmType = germplasmType;
        if (threatLevel) query.threatLevel = threatLevel;
        if (verified !== undefined) query.isVerified = verified === 'true';
        
        if (req.user && req.user.role !== 'admin') {
            query.verificationStatus = 'verified';
        }

        if (search) {
            query.$text = { $search: search };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [varieties, total] = await Promise.all([
            Variety.find(query)
                .populate('crop', 'name category')
                .populate('contributor', 'name email userType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Variety.countDocuments(query)
        ]);

        res.json({
            success: true,
            count: varieties.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            varieties: varieties.map(v => formatVariety(v))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getVarietyById = async (req, res) => {
    try {
        const variety = await Variety.findById(req.params.id)
            .populate('crop', 'name scientificName category')
            .populate('contributor', 'name email userType location contactNumber')
            .populate('verifiedBy', 'name email');

        if (!variety) {
            return res.status(404).json({
                success: false,
                message: 'Variety not found'
            });
        }

        // Hide unverified varieties from non-admin users
        if (req.user && req.user.role !== 'admin' && variety.verificationStatus !== 'verified') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            variety: formatVariety(variety)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};



exports.deleteVariety = async (req, res) => {
    try {
        const variety = await Variety.findById(req.params.id);

        if (!variety) {
            return res.status(404).json({
                success: false,
                message: 'Variety not found'
            });
        }

        // Only admin or contributor can delete
        if (req.user.role !== 'admin' && variety.contributor.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this variety'
            });
        }

        // Remove variety from crop
        await Crop.findByIdAndUpdate(variety.crop, {
            $pull: { varieties: variety._id }
        });

        // Remove variety from user's contributed list
        await User.findByIdAndUpdate(variety.contributor, {
            $pull: { contributedVarieties: variety._id }
        });

        await variety.deleteOne();

        res.json({
            success: true,
            message: 'Variety deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.verifyVariety = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification status'
            });
        }

        const variety = await Variety.findById(id);
        if (!variety) {
            return res.status(404).json({
                success: false,
                message: 'Variety not found'
            });
        }

        variety.verificationStatus = status;
        variety.isVerified = status === 'verified';
        variety.verifiedBy = req.user.id;
        variety.verificationDate = Date.now();
        
        if (notes) {
            variety.notes = variety.notes ? `${variety.notes}\n[Verification Note: ${notes}]` : `[Verification Note: ${notes}]`;
        }

        await variety.save();

        res.json({
            success: true,
            message: `Variety ${status} successfully`,
            variety: formatVariety(variety)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getUserVarieties = async (req, res) => {
    try {
        const varieties = await Variety.find({ contributor: req.user.id })
            .populate('crop', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: varieties.length,
            varieties: varieties.map(v => formatVariety(v))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getPendingVerifications = async (req, res) => {
    try {
        const varieties = await Variety.find({ verificationStatus: 'pending' })
            .populate('crop', 'name')
            .populate('contributor', 'name email userType')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: varieties.length,
            varieties: varieties.map(v => formatVariety(v))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};