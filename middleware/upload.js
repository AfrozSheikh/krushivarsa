const upload = require('../config/upload');

const uploadSingleImage = upload.single('image');

module.exports = uploadSingleImage;