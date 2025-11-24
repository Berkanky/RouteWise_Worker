const mongoose = require("mongoose");

const LockAllUpdates = require("../SchemaLocks/LockAllUpdates");

const AuditLogSchema = new mongoose.Schema(
  {
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    RequestId: { 
        type: String, 
        default: null 
    },
    SessionId: { 
        type: String, 
        default: null 
    },
    Action: { 
        type: String, 
        required: false 
    },
    Success: { 
        type: Boolean, 
        required: true 
    },
    HttpStatus: { 
        type: Number, 
        default: null 
    },
    TokenJtiHash: { 
        type: String, 
        default: null 
    },
    IpAddress: { 
        type: String, 
        default: null 
    },
    UserAgent: { 
        type: String, 
        default: null 
    },
    GeoCountry: { 
        type: String, 
        default: null 
    },
    CreatedDate: { 
        type: Date, 
        default: new Date()
    },
    Method:{
        type: String,
        required: false
    },
    Path:{
        type: String,
        required: false
    },
    RequestParams:{
        type: String,
        required: false
    },
    RequestBody:{
        type: String,
        required: false
    },
    Provider:{
        type: String,
        required: false
    },
    ServiceDetail:{
        type: String,
        required: false
    }
  }
);

AuditLogSchema.index({ UserId: 1, CreatedDate: -1 });
AuditLogSchema.index({ Action: 1, CreatedDate: -1 });
AuditLogSchema.index({ FlowId: 1, Step: 1 });
AuditLogSchema.index({ TokenJtiHash: 1 });
AuditLogSchema.index({ RequestId: 1 });

AuditLogSchema.plugin(LockAllUpdates);

module.exports = mongoose.model("AuditLog", AuditLogSchema);