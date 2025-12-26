const formatUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        contactNumber: user.contactNumber,
        location: user.location,
        isApproved: user.isApproved,
        status: user.status,
        createdAt: user.createdAt
    };
};

const formatVariety = (variety) => {
    const formattedVariety = {
        id: variety._id,
        crop: variety.crop,
        name: variety.name,
        type: variety.type,
        germplasmType: variety.germplasmType,
        contributor: variety.contributor,
        location: variety.location,
        specialCharacteristics: variety.specialCharacteristics,
        notes: variety.notes,
        detailedDescription: variety.detailedDescription,
        threatLevel: variety.threatLevel,
        isVerified: variety.isVerified,
        verificationStatus: variety.verificationStatus,
        createdAt: variety.createdAt
    };

    // Format image for response
    if (variety.image && variety.image.data) {
        if (variety.image.data.startsWith('data:image/')) {
            // Already a data URL
            formattedVariety.image = variety.image.data;
        } else if (variety.image.contentType) {
            // Convert to data URL
            formattedVariety.image = `data:${variety.image.contentType};base64,${variety.image.data}`;
        } else {
            // Fallback to just the data
            formattedVariety.image = variety.image.data;
        }
    } else {
        formattedVariety.image = null;
    }

    return formattedVariety;
};

const getDashboardStats = async (Crop, Variety, User) => {
    const totalCrops = await Crop.countDocuments();
    const totalVarieties = await Variety.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer', status: 'approved' });
    const totalInstitutions = await User.countDocuments({ role: 'institution', status: 'approved' });
    
    const threatStats = await Variety.aggregate([
        {
            $group: {
                _id: '$threatLevel',
                count: { $sum: 1 }
            }
        }
    ]);

    const germplasmStats = await Variety.aggregate([
        {
            $group: {
                _id: '$germplasmType',
                count: { $sum: 1 }
            }
        }
    ]);

    const typeStats = await Variety.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);

    return {
        totalCrops,
        totalVarieties,
        totalFarmers,
        totalInstitutions,
        threatStats: threatStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        germplasmStats: germplasmStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {}),
        typeStats: typeStats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {})
    };
};

module.exports = { formatUser, formatVariety, getDashboardStats };