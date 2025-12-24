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
    return {
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
        image: variety.image ? `/uploads/images/${variety.image}` : null,
        threatLevel: variety.threatLevel,
        isVerified: variety.isVerified,
        verificationStatus: variety.verificationStatus,
        createdAt: variety.createdAt
    };
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