//Server Cache.
const { get_or_compute_with_lock } = require("../helpers/singe_flight");
const server_cache = require("../cache");

//Şemalar.
const CountryMeta = require("../Schemas/CountryMeta");

var node_cache_key = 'fuel_price_details';

async function fuel_price_details(){

    await server_cache.del(node_cache_key);

    var country_meta = await CountryMeta.find().select("Name FuelPrices").lean();
    if( !country_meta.length ) return false;

    await get_or_compute_with_lock(
        node_cache_key,
        async () => {
            return country_meta;
        },
        {
            cacheTTL: 604800,
            lockTTL: 180,
            waitTimeoutMs: 15000,
            pollEveryMs: 300,
            verbose: true 
        }
    );

    return true;
};

async function control_fuel_price_details_node_cache(){

    var cached_fuel_price_details = await server_cache.get(node_cache_key);
    if( !cached_fuel_price_details ) await fuel_price_details();
};

control_fuel_price_details_node_cache();

module.exports = fuel_price_details;