import mongoose from 'mongoose';

const EntrySchema = new mongoose.Schema({
  dateKey: {
    type: String,
    required: true,
    unique: true,
  },
  entries: {
    type: Array,
    default: [],
  },
}, { timestamps: true });

export default mongoose.models.Entry || mongoose.model('Entry', EntrySchema);
