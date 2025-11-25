const CountryMeta = require("../../Schemas/CountryMeta");

var country_currency_map_json = require("./country_currency_map.json");
if( !country_currency_map_json ) throw 'country_currency_map_json required. ';

async function country_currency_operations(){

    var country_meta = await CountryMeta.find().lean();

    for(var i = 0; i < country_meta.length; i++){
        var country_name = country_meta[i]["Name"];

        var existing_currency_data = country_currency_map_json.find(function(item){ return item.Name === country_name });
        if( !existing_currency_data ) continue;

        var currency_code = existing_currency_data["CurrencyCode"];

        var country_meta_filter = { Name: country_name };
        var country_meta_update = {
            $set: { CurrencyCode: currency_code }
        };

        await CountryMeta.findOneAndUpdate(country_meta_filter, country_meta_update);
    };
};