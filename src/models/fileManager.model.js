const mongoose = require('mongoose');

const fileManagerItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['folder', 'PDF', 'DOC', 'XLS', 'TXT', 'JPG', 'PNG', 'MP4', 'ZIP', 'file']
    },
    folderId: {
        type: String,
        default: 'root'
    },

    // For files only
    url: { type: String }, // Cloudinary URL
    cloudinaryId: { type: String }, // Cloudinary public_id for deletion
    size: { type: String }, // e.g. "1.2 MB"

    // Metadata
    createdBy: { type: String, default: 'System' },
    contents: { type: String }, // For folders: "5 files"
    description: { type: String },
}, {
    timestamps: true,
});

// Virtual for modifiedAt (alias for updatedAt)
fileManagerItemSchema.virtual('modifiedAt').get(function() {
    return this.updatedAt;
});

// Ensure virtuals are included when converting to JSON
fileManagerItemSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FileManagerItem', fileManagerItemSchema);
