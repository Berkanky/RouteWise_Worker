// models/ExportedPdf.js (CJS)
const mongoose = require('mongoose');

const ExportedPdfSchema = new mongoose.Schema({
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  RouteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'CalculatedRoutes',
    index: true
  },
  FileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  FileName: { type: String, default: null },
  ContentType: { type: String, default: 'application/pdf' },
  Length: { type: Number, default: null }, 
  UploadedAt: { type: Date, default: () => new Date() },
  ExpiresAt: { type: Date, default: null },
  Status: {
    type: String,
    enum: ['ready', 'deleted', 'failed'],
    default: 'ready',
    index: true
  },
  Meta: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

var ExportedPdf = mongoose.model('ExportedPdf', ExportedPdfSchema);
module.exports = ExportedPdf;