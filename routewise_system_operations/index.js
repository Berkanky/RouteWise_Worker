const User = require("../Schemas/User");
const SharedLink = require("../Schemas/SharedLink");

async function delete_temporary_accounts(){

    var current_date = new Date();

    try{

        var filter = { TOTP_ENABLED: false, IsTemporary: true, TOTP_Expires_Date: { $exists: true, $lt: current_date } };

        await User.deleteMany(filter);

        return true;
    }catch(err){
        console.error(err);
        return false;
    }
};

async function set_expired_shared_links_active_status(){

    var shared_link_filter = { Active: true };
    var shared_links = await SharedLink.find(shared_link_filter).select("Active ExpiresDate");

    for(var i = 0; i < shared_links.length; i++){
        var row = shared_links[i];
        var shared_link_id = (row["_id"]).toString();

        var is_expired = new Date() > new Date(String(row["ExpiresDate"])) ? true : false;
        if( !is_expired ) continue;

        var shared_link_update =  {
            $set:{
                Active: false
            }
        };

        await SharedLink.findByIdAndUpdate(shared_link_id, shared_link_update);
    }
};

async function routewise_system_operations(){
    await delete_temporary_accounts();
    await set_expired_shared_links_active_status();
    console.log("routewise_system_operations completed. ");
};

module.exports = routewise_system_operations;