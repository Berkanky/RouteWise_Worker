const CountryMeta = require("../Schemas/CountryMeta");

var toll_pass_enum_list_descriptions_json = require("./toll_pass_enum_list_descriptions.json");
if( !toll_pass_enum_list_descriptions_json ) throw "toll_pass_enum_list_descriptions required. ";

var total_update_count = 0;
async function toll_pass_enum_list_description_migrate(){
    
    for(var i = 0; i < toll_pass_enum_list_descriptions_json.length; i++){

        var country_meta_data = toll_pass_enum_list_descriptions_json[i];

        var country_meta_id = country_meta_data['_id']['$oid'];
        
        if( !country_meta_id ) continue;
        if( !'TollPassEnums' in country_meta_data ) continue;
        
        for(var ci = 0; ci < (country_meta_data['TollPassEnums']).length; ci++ ){
            var toll_pass_enums_data = country_meta_data['TollPassEnums'][ci];

            var google_enum = toll_pass_enums_data['GoogleEnum'];   

            var country_meta = await CountryMeta.findById(country_meta_id).select('TollPassEnums');
            if( !country_meta ) continue;
            
            var finded_toll_pass_enum = country_meta['TollPassEnums'].find(function(item){ return item.GoogleEnum === google_enum });
            if( !finded_toll_pass_enum ) continue;

            finded_toll_pass_enum.UsageDescription = toll_pass_enums_data['UsageDescription'];
            await country_meta.save();
        };

        total_update_count = total_update_count + 1;
    };

    console.log("Update -> "  + total_update_count);
};

module.exports = toll_pass_enum_list_description_migrate;