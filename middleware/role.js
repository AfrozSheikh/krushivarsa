const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }

        // Additional checks for farmer/institution approval
        if (req.user.role !== 'admin') {
            if (req.user.status !== 'approved' || !req.user.isApproved) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account is not approved yet'
                });
            }
        }

        next();
    };
};

module.exports = authorize;