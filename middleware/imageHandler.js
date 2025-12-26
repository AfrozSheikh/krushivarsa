const validateImage = (req, res, next) => {
    try {
        // If no image is being uploaded, continue
        if (!req.body.image) {
            return next();
        }

        // Parse the image data if it's a string
        let imageData;
        if (typeof req.body.image === 'string') {
            try {
                imageData = JSON.parse(req.body.image);
            } catch (error) {
                // If it's not JSON, assume it's already a Base64 string
                imageData = req.body.image;
            }
        } else {
            imageData = req.body.image;
        }

        // Handle different formats from frontend
        if (typeof imageData === 'object' && imageData.data) {
            // Format: {data: "base64string", contentType: "image/jpeg"}
            req.body.image = imageData;
        } else if (typeof imageData === 'string') {
            // Format: Just Base64 string
            // Try to detect content type
            let contentType = 'image/jpeg';
            if (imageData.startsWith('data:image/')) {
                // Extract content type from data URL
                const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,/);
                if (matches) {
                    contentType = `image/${matches[1]}`;
                }
            }
            req.body.image = {
                data: imageData,
                contentType: contentType
            };
        }

        // Validate image size (5MB limit)
        const maxSize = parseInt(process.env.MAX_IMAGE_SIZE || 5) * 1024 * 1024; // MB to bytes
        const imageSize = Buffer.byteLength(req.body.image.data, 'base64');
        
        if (imageSize > maxSize) {
            return res.status(400).json({
                success: false,
                message: `Image size exceeds ${process.env.MAX_IMAGE_SIZE || 5}MB limit`
            });
        }

        next();
    } catch (error) {
        console.error('Image validation error:', error);
        res.status(400).json({
            success: false,
            message: 'Invalid image format'
        });
    }
};

module.exports = { validateImage };