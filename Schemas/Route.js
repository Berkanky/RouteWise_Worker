const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    UserId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    ProcessId:{
        type: String,
        required: true
    },
    VehicleId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vehicle'
    },
    Name:{
        type: String,
        required: true
    },
    Description:{
        type: String,
        required: false
    },
    FuelPriceAtTransactionTime:{
        type: Number,
        required: true
    },
    FuelPriceUnits:{
        type: String,
        required: false
    },
    FuelPricePeriod:{
        type: Date,
        required: false
    },
    FuelTypeDetail:{
        type: String,
        required: false
    },
    NumberOfPeople:{
        type: Number,
        required: true
    },
    LuggageWeight:{
        type: Number,
        required: true
    },
    DriveType:{
        type: String,
        required: true,
        enum: [ "Economic", "Normal", "Aggressive"]
    },
    StartLocation:{
        type: String,
        required: true
    },
    StartLocationLatitude:{
        type: String,
        required: true
    },
    StartLocationLongitude:{
        type: String,
        required: true
    },
    TravelMode:{
        type: String,
        required: true
    },
    DestinationLocation:{
        type: String,
        required: true
    },
    DestinationLocationLatitude:{
        type: String,
        required: true
    },
    DestinationLocationLongitude:{
        type: String,
        required: true
    },
    TollPass:{
        type: Array,
        required: true
    },
    RoutingPreference:{
        type: String,
        required: true
    },
    CreatedDate:{
        type: Date,
        required: true,
        default: new Date()
    },
    UpdatedDate:{
        type: Date,
        required: false,
        default: null
    },
    MultipleRoute:{
        type: Boolean,
        required: false,
        default: false
    },
    NumberOfMultipleRoute:{
        type: Number,
        required: false
    },
    CurrencyCode:{
        type: String,
        required: false
    }
});

const CalculatedRoutes = mongoose.model('CalculatedRoutes', RouteSchema);
module.exports = CalculatedRoutes;