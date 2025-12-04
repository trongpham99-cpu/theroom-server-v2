const FileManagerItem = require('../models/fileManager.model');

// Get items (with optional filters)
exports.getItems = async (req, res) => {
    try {
        const { folderId, type, path } = req.query;

        let query = {};

        if (folderId) {
            query.folderId = folderId;
        }

        if (type) {
            query.type = type;
        }

        const items = await FileManagerItem.find(query).sort({ createdAt: -1 });

        return res.status(200).json(items);
    } catch (error) {
        console.error('Get items error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách items',
            error: error.message,
        });
    }
};

// Get single item
exports.getItem = async (req, res) => {
    try {
        const item = await FileManagerItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                status: 'error',
                message: 'Item không tồn tại',
            });
        }

        return res.status(200).json(item);
    } catch (error) {
        console.error('Get item error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy thông tin item',
            error: error.message,
        });
    }
};

// Create folder
exports.createFolder = async (req, res) => {
    try {
        const { name, folderId = 'root', description } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Tên folder là bắt buộc',
            });
        }

        const folder = await FileManagerItem.create({
            name,
            type: 'folder',
            folderId,
            description,
            contents: '0 files',
            size: '0 MB',
        });

        return res.status(201).json(folder);
    } catch (error) {
        console.error('Create folder error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi tạo folder',
            error: error.message,
        });
    }
};

// Upload file (will integrate with Cloudinary)
exports.uploadFile = async (req, res) => {
    try {
        // TODO: Implement Cloudinary upload
        return res.status(501).json({
            status: 'error',
            message: 'Upload file chưa được implement',
        });
    } catch (error) {
        console.error('Upload file error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi upload file',
            error: error.message,
        });
    }
};

// Delete items
exports.deleteItems = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Danh sách ID không hợp lệ',
            });
        }

        // TODO: Delete files from Cloudinary if they are files
        const result = await FileManagerItem.deleteMany({ _id: { $in: ids } });

        return res.status(200).json({
            status: 'success',
            message: `Đã xóa ${result.deletedCount} items`,
        });
    } catch (error) {
        console.error('Delete items error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi xóa items',
            error: error.message,
        });
    }
};

// Rename item
exports.renameItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                status: 'error',
                message: 'Tên mới là bắt buộc',
            });
        }

        const item = await FileManagerItem.findByIdAndUpdate(
            id,
            { name },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                status: 'error',
                message: 'Item không tồn tại',
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Đổi tên thành công',
            data: item,
        });
    } catch (error) {
        console.error('Rename item error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi đổi tên item',
            error: error.message,
        });
    }
};

// Initialize default folders
exports.initDefaultFolders = async (req, res) => {
    try {
        // Check if default folders already exist
        const existingFolders = await FileManagerItem.find({
            folderId: 'root',
            type: 'folder',
            name: { $in: ['Thông tin khách thuê', 'Thông tin phòng'] }
        });

        if (existingFolders.length >= 2) {
            return res.status(200).json({
                status: 'success',
                message: 'Các folder mặc định đã tồn tại',
                data: existingFolders,
            });
        }

        const folders = [];

        // Create "Thông tin khách thuê" if not exists
        if (!existingFolders.find(f => f.name === 'Thông tin khách thuê')) {
            const folder1 = await FileManagerItem.create({
                name: 'Thông tin khách thuê',
                type: 'folder',
                folderId: 'root',
                description: 'Lưu trữ thông tin và tài liệu của khách thuê',
                contents: '0 files',
                size: '0 MB',
            });
            folders.push(folder1);
        }

        // Create "Thông tin phòng" if not exists
        if (!existingFolders.find(f => f.name === 'Thông tin phòng')) {
            const folder2 = await FileManagerItem.create({
                name: 'Thông tin phòng',
                type: 'folder',
                folderId: 'root',
                description: 'Lưu trữ thông tin và tài liệu của phòng',
                contents: '0 files',
                size: '0 MB',
            });
            folders.push(folder2);
        }

        return res.status(201).json({
            status: 'success',
            message: 'Đã tạo các folder mặc định',
            data: [...existingFolders, ...folders],
        });
    } catch (error) {
        console.error('Init default folders error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi khởi tạo folders mặc định',
            error: error.message,
        });
    }
};
