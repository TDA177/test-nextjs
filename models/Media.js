import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  mediaId: {
    type: String,
    required: true,
    unique: true,
  },
  dataUrl: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);
