const mongoose = require('mongoose');

const SharedLinkSchema = new mongoose.Schema({
    RouteId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'CalculatedRoutes',
        index: true
    },
    CreatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    ShareId:{
        type: String,
        required: true,
        unique: true
    },
    CreatedDate:{
        type: Date,
        required: true,
        default: new Date()
    },
    ExpiresDate:{
        type: Date,
        required: true
    },
    Token:{
        type: String,
        required: true
    },
    AccessCount:{
        type: Number,
        required: true,
        default: 0
    },
    LastAccessed:{
        type: Date,
        required: false
    },
    Active:{
        type: Boolean,
        required: true,
        default: true
    },
    UpdatedDate:{
        type: Date,
        required: false
    },
    AccessLogs: [
        {
            AccessedAt: { type: Date, default: new Date() },      // Erişim zamanı
            IPAddress: { type: String },                        // İstek atan IP
            UserAgent: { type: String },                        // Tarayıcı veya istemci bilgisi
            Referrer: { type: String },                         // Nereden gelmiş (isteğe bağlı)
            CountryCode: { type: String },                      // GeoIP çözümünden ülke kodu (örn. "TR", "US")
            StatusCode: { type: Number },                       // 200, 403, 404 gibi cevap kodu
            ErrorMessage: { type: String }                      // Hata varsa kısa mesaj
        }
    ]
});

const SharedLink = mongoose.model('SharedLink', SharedLinkSchema);
module.exports = SharedLink;