const mongoose = require('mongoose');

const FXBaseSchema = new mongoose.Schema({
    BaseCurrency: {
        type: String,
        required: false
    },
    QuoteCurrency:{
        type: String,
        required: false
    },
    Rate:{
        type: Number,
        required: false
    },
    Source:{
        type: String,
        required: false
    },
    Period:{
        type: Date,
        required: false
    }
});

const TollPassSchema = new mongoose.Schema({
    GoogleEnum: {
        type: String,
        required: true
    },
    DisplayName: {
        type: String,
        required: true
    },
    UsageDescription:{
        type: String,
        required: false
    }
}, { _id: false });

const FuelPricesSchema = new mongoose.Schema({
    Year:{ //2025
        type: Number,
        required: false
    },
    Value: {
        type: Number,
        required: false
    },
    Period:{ // new Date()
        type: Date,
        required: false
    },
    Units:{ //gal - li
        type: String,
        required: false
    },
    EnergyType:{ // 'GASOLINE','DIESEL','ELECTRICITY'
        type: String,
        required: false,
        enum: ['GASOLINE','DIESEL','ELECTRICITY']
    },
    Grade:{ //Regular - Premium - Midgrade
        type: String,
        required: false
    },
    Method: {  // 'FACTOR', 'SCRAPED', 'API'
        type: String,
        required: false
    },       
    Source: { // 'ESTIMATED_FROM_GASOLINE', 'EIA', vs.
        type: String,
        required: false
    },       
    FactorUsed: { // Dizel için kullanılan katsayı
        type: Number,
        required: false 
    },   
    Confidence: {  // 0..1
        type: Number,
        required: false
    },
    CreatedDate:{
        type: Date,
        required: false,
        default: new Date()
    },
    UpdatedDate:{
        type: Date,
        required: false,
        default: new Date()
    },
    BaseUnits:{
        type: String,
        required: false,
        default: "GAL"
    },
    EMA:{
        type: Number,
        required: false
    },
    PrevEMA:{
        type: Number,
        required: false
    },
    AlphaUsed:{
        type: Number,
        required: false
    },
    PrevGas:{
        type: Number,
        required: false
    },
    StepDelta:{
        type: Number,
        required: false
    },
    VolBaseline:{
        type: Number,
        required: false
    },
    BackendVersion:{
        type: String,
        required: false,
        default: process.env.BACKEND_VERSION
    },
    Region:{
        type: String,
        required: false
    },
    IncomeClass:{
        type: String,
        required: false
    },
    DataNote:{
        type: String,
        required: false
    },
    FX: FXBaseSchema
});

const CountryMetaSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Code: {
        type: String,
        required: false
    },
    CurrencyCode:{
        type: String,
        required: false
    },
    DialCode: {
        type: String,
        required: false
    },
    TollPassEnums: {
        type: [TollPassSchema],
        required: false,
        default: []
    },
    FuelPrices:{
        type: [FuelPricesSchema],
        required: false,
        default: []
    },
    UpdatedDate:{
        type: Date,
        required: false,
        default: new Date()
    }
}, { collection: 'country_meta' });

const CountryMeta = mongoose.model('CountryMeta', CountryMetaSchema, 'countrymeta');
module.exports = CountryMeta;