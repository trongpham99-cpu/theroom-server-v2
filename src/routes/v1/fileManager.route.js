const express = require('express');
const router = express.Router();
const fileManagerController = require('../../controllers/fileManager.controller');

// Items
router.get('/items', fileManagerController.getItems);
router.get('/items/:id', fileManagerController.getItem);
router.delete('/items', fileManagerController.deleteItems);
router.patch('/items/:id/rename', fileManagerController.renameItem);

// Folders
router.post('/folders', fileManagerController.createFolder);
router.post('/folders/init', fileManagerController.initDefaultFolders);

// Files
router.post('/files', fileManagerController.uploadFile);

module.exports = router;
