const mongoose = require('mongoose');

const PolylineSchema = new mongoose.Schema({
  RouteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'CalculatedRoutes',
    index: true
  },
  Enc: {
    Alg: { type: String, enum: ['AES-256-GCM'], default: 'AES-256-GCM' },
    Kver: { type: Number, required: true, default: 1 },
    iv: { type: Buffer, required: true },  // 12 byte
    Tag: { type: Buffer, required: true }, // 16 byte
    Blob: { type: Buffer, required: true } // gzip+AES çıktısı
  },
  Meta: {
    Encoding: { type: String, enum: ['encoded', 'decoded'], default: 'encoded' },
    OrigSize: { type: Number },
    GzSize: { type: Number }
  },
  CreatedDate: {
    type: Date,
    required: true,
    default: new Date()
  },
  TollRoadEstimatedPriceDollar:{
    type: Number,
    required: false,
    default: 0
  },
  StrokeColor:{
    type: String,
    required: false,
    default: null
  },
  DistanceMIL:{
    type: Number,
    required: true
  },
  AverageDestinationTimeSecond:{ //12581s
    type: String,
    required: true
  },
  TotalGallon:{
    type: Number,
    required: true
  },
  TotalGallonCost:{
    type: Number,
    required: true
  },
  TotalCost:{
    type: Number,
    required: true,
  }
})

const Polyline = mongoose.model('Polyline', PolylineSchema);
module.exports = Polyline;