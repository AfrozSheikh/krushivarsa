const Crop = require('../models/Crop');

exports.createCrop = async (req, res) => {
    try {
        const { name, scientificName, description, category } = req.body;

        // Check if crop already exists
        const cropExists = await Crop.findOne({ name });
        if (cropExists) {
            return res.status(400).json({
                success: false,
                message: 'Crop already exists'
            });
        }

        const crop = await Crop.create({
            name,
            scientificName,
            description,
            category,
            addedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            crop
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getAllCrops = async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = {};

        if (category) query.category = category;
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const crops = await Crop.find(query)
            .populate('addedBy', 'name email')
            .populate({
                path: 'varieties',
                select: 'name type germplasmType threatLevel createdAt',
                options: { limit: 5 }
            });

        res.json({
            success: true,
            count: crops.length,
            crops
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getCropById = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id)
            .populate('addedBy', 'name email')
            .populate({
                path: 'varieties',
                populate: {
                    path: 'contributor',
                    select: 'name email userType'
                }
            });

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found'
            });
        }

        res.json({
            success: true,
            crop
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.updateCrop = async (req, res) => {
    try {
        const crop = await Crop.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found'
            });
        }

        res.json({
            success: true,
            crop
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.deleteCrop = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: 'Crop not found'
            });
        }

        // Check if crop has varieties
        if (crop.varieties.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete crop with existing varieties'
            });
        }

        await crop.deleteOne();

        res.json({
            success: true,
            message: 'Crop deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};