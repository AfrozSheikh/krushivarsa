const Crop = require('../models/Crop');
const Variety = require('../models/Variety');
const Notice = require('../models/Notice');

exports.getAllPublicCrops = async (req, res) => {
    try {
        const crops = await Crop.find()
            .select('name scientificName category description')
            .populate({
                path: 'varieties',
                match: { verificationStatus: 'verified' },
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

exports.getAllPublicVarieties = async (req, res) => {
    try {
        const {
            crop,
            type,
            germplasmType,
            threatLevel,
            search,
            page = 1,
            limit = 10
        } = req.query;

        const query = { verificationStatus: 'verified' };

        if (crop) query.crop = crop;
        if (type) query.type = type;
        if (germplasmType) query.germplasmType = germplasmType;
        if (threatLevel) query.threatLevel = threatLevel;
        if (search) {
            query.$text = { $search: search };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [varieties, total] = await Promise.all([
            Variety.find(query)
                .populate('crop', 'name category')
                .populate('contributor', 'name userType location')
                .select('-verificationStatus -verifiedBy -verificationDate')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Variety.countDocuments(query)
        ]);

        // Format varieties using helper
        const formattedVarieties = varieties.map(variety => {
            const varietyObj = variety.toObject();
            const formatted = {
                ...varietyObj,
                // Use formatVariety helper or custom format
                image: variety.image && variety.image.data 
                    ? (variety.image.data.startsWith('data:image/') 
                        ? variety.image.data 
                        : `data:${variety.image.contentType || 'image/jpeg'};base64,${variety.image.data}`)
                    : null
            };
            return formatted;
        });

        res.json({
            success: true,
            count: formattedVarieties.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            varieties: formattedVarieties
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getPublicVarietyById = async (req, res) => {
    try {
        const variety = await Variety.findOne({
            _id: req.params.id,
            verificationStatus: 'verified'
        })
            .populate('crop', 'name scientificName category')
            .populate('contributor', 'name userType location')
            .select('-verificationStatus -verifiedBy -verificationDate');

        if (!variety) {
            return res.status(404).json({
                success: false,
                message: 'Variety not found or not verified'
            });
        }

        // Format image
        const formattedVariety = variety.toObject();
        if (formattedVariety.image && formattedVariety.image.data) {
            if (formattedVariety.image.data.startsWith('data:image/')) {
                // Already a data URL
                formattedVariety.image = formattedVariety.image.data;
            } else if (formattedVariety.image.contentType) {
                // Convert to data URL
                formattedVariety.image = `data:${formattedVariety.image.contentType};base64,${formattedVariety.image.data}`;
            } else {
                formattedVariety.image = formattedVariety.image.data;
            }
        } else {
            formattedVariety.image = null;
        }

        res.json({
            success: true,
            variety: formattedVariety
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ... (rest of the functions remain the same)

exports.getActiveNotices = async (req, res) => {
    try {
        const notices = await Notice.find({ isActive: true })
            .select('title content createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return res.status(200).json({
            success: true,
            count: notices.length,
            notices
        });

    } catch (error) {
        console.error('Get Active Notices Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};


exports.getStatistics = async (req, res) => {
    try {
        const [cropCount, varietyCount, threatStats, germplasmStats] = await Promise.all([
            Crop.countDocuments(),
            Variety.countDocuments({ verificationStatus: 'verified' }),
            Variety.aggregate([
                { $match: { verificationStatus: 'verified' } },
                { $group: { _id: '$threatLevel', count: { $sum: 1 } } }
            ]),
            Variety.aggregate([
                { $match: { verificationStatus: 'verified' } },
                { $group: { _id: '$germplasmType', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            statistics: {
                totalCrops: cropCount,
                totalVarieties: varietyCount,
                threatLevels: threatStats.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                germplasmTypes: germplasmStats.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {})
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