const mongoose = require('mongoose');

const Backup_Codes = new mongoose.Schema({
    Hash:{
        type: String,
        required: false
    },
    CreatedDate:{
        type: Date,
        required: false,
        default: new Date()
    },
    Used:{
        type: Boolean,
        required: false,
        default: false
    },
    BatchId:{
        type: String,
        required: false
    },
    UsedDate:{
        type: Date,
        required: false
    },
    UsedIP:{
        type: String,
        required: false
    },
    UserAgent:{
        type: String,
        required: false
    }
});

const UserSchema = new mongoose.Schema({
    UserName:{
        type:String,
        required: true,
        unique: true
    },
    Password:{
        type:String,
        required: false
    },
    CreatedDate:{
        type:Date,
        required: false,
        default: new Date()
    },
    UpdatedDate:{
        type:Date,
        required: false
    },
    LastLoginDate:{
        type:Date,
        required: false
    },
    LoginDate:{
        type:Date,
        required: false
    },
    IsTemporary:{
        type:Boolean,
        required: false,
        default: true
    },
    Active:{
        type:Boolean,
        required: false,
        default: false
    },
    IsAccountDeleted:{
        type: Boolean,
        required: false,
        defualt: false
    },
    AccountDeleteTransactionOrderDate:{
        type: Date,
        required: false
    },
    AccountDeletionReason:{
        type: String,
        required: false
    },
    TOTP_ENABLED: {
        type: Boolean,
        required: false
    },
    TOTP_SECRET_ENC:{
        type: String,
        required: false
    },
    TOTP_TEMP_SECRET_ENC:{
        type: String,
        required: false
    },
    TOTP_LAST_USED_STEP:{
        type: Number,
        required: false
    },
    TOTP_QR_Code:{
        type: String,
        required: false
    },
    TOTP_Manual_Secret:{
        type: String,
        required: false
    },
    TOTP_Expires_Date:{
        type: Date,
        required: false
    },
    Backup_Codes:[Backup_Codes],
    Backup_Codes_BatchId: {
        type: String,
        required: false
    },
    Backup_Codes_Created_Date:{
        type: Date,
        required: false
    },
    Failed_Login_Attempt:{
        type: Number,
        required: false,
        default: 0
    },
    Account_Lock_Expiration_Date:{
        type: Date,
        required: false,
        default: null
    }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;