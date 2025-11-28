const server_cache = require("../cache");
const CountryMeta = require("../Schemas/CountryMeta");

var node_cache_key = 'fuel_price_details';
var country_meta_data_node_cache_timeout = 604800;

async function set_country_meta_data_cache(){

    await server_cache.del(node_cache_key);

    var country_meta = await CountryMeta.find().select("Name FuelPrices").lean();
    if( !country_meta.length ) return false;

    await server_cache.set(node_cache_key, country_meta, country_meta_data_node_cache_timeout);
    console.log("set_country_meta_data_cache completed. ");
    return true;
};

async function control_fuel_price_details_node_cache(){

    var cached_fuel_price_details = await server_cache.get(node_cache_key);
    if( !cached_fuel_price_details ) await set_country_meta_data_cache();
};

control_fuel_price_details_node_cache();

module.exports = set_country_meta_data_cache;