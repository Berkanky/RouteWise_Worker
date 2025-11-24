const axios = require('axios');

//Fonksiyonlar
const FormatDateFunction = require("../MyFunctions/FormatDateFunction");
const FormatNumber = require("../MyFunctions/FormatNumber");

const CountryMeta = require('../Schemas/CountryMeta');

//Node-Cache, Redis-Cache
var server_cache = require("../cache");
const { get_or_compute_with_lock } = require("../helpers/singe_flight");

const { LoadConfig } = require('../ConfigOperations/app_config');

var FRANKFURTER_API_URL = process.env.FRANKFURTER_API_URL;
var FRANKFURTER_API_REQUEST_URL = '/v1/latest';

var load_config = LoadConfig();
var base_currency = load_config?.Calculator.currency_details?.BASE_CURRENCY;

var currencies_node_cache_key = 'currencies';

if( !FRANKFURTER_API_URL ) throw "FRANKFURTER_API_URL required. ";
if( !base_currency ) throw "base_currency required. ";

async function frankfurter_currencies_details(){
    console.log("The currency exchange rate service has been triggered. " + FormatDateFunction(String(new Date())));
    var success = false;
    var detail = null;
    var response_data = {};

    try{
        
        var default_request_response = { success: false, response_data: {} };

        var country_meta_data = await CountryMeta.find().select("Name Code CurrencyCode FuelPrices").lean();

        if( !country_meta_data ) return default_request_response;

        country_meta_data = country_meta_data.filter(function(item){ return 'FuelPrices' in item && 'CurrencyCode' in item });
        country_meta_data = country_meta_data.filter(function(item){ return item.FuelPrices.length });

        var symbols = country_meta_data.map(function(item){ return item.CurrencyCode });

        var symbols_query_val = '';

        var count_symbol = 0;
        for(var i = 0; i < symbols.length; i++){
            if( i == 0 ) symbols_query_val = symbols_query_val + symbols[i];
            else if( i > 0 ) symbols_query_val = symbols_query_val + ',' + symbols[i];
            count_symbol = count_symbol + 1;
        };

        var api_url = FRANKFURTER_API_URL + FRANKFURTER_API_REQUEST_URL + '?base=' + base_currency + '&symbols=' + symbols_query_val;

        var response = await axios.get(api_url);

        if( response.status !== 200 ) return default_request_response;

        response_data = { period: response?.data?.date, response_status: response.status, success: true, server_request_date: FormatDateFunction(String(new Date())) };

        Object.assign(response_data, { 
            frankfurter_service_response_data: response?.data || {},
        });

        var detailed_rates = [];
        var index = 1;

        var base_country_details = await CountryMeta.findOne({ CurrencyCode: base_currency, Name: 'United States' }).select("Name Code DialCode CurrencyCode");
        if( base_country_details ) detailed_rates.push({ 
            index: index, 
            Name: base_country_details.Name, 
            Code: base_country_details.Code, 
            CurrencyCode: base_country_details.CurrencyCode, 
            Rate: 1, 
            formatted_rate: FormatNumber(Number(1)) 
        });

        for(var key in response.data.rates){
            index = index + 1;
            var rates_row_data = response["data"]["rates"][key];
            var currency_code = key;

            var finded_counry_meta_data = country_meta_data.find(function(item){ return item.CurrencyCode === currency_code });
            if( !finded_counry_meta_data ) continue;

            var detailed_rate_obj = { index: index, Name: finded_counry_meta_data.Name, Code: finded_counry_meta_data.Code, CurrencyCode: currency_code, Rate: rates_row_data, formatted_rate: FormatNumber(rates_row_data) };
            detailed_rates.push(detailed_rate_obj);
            continue;
        };

        Object.assign(response_data.frankfurter_service_response_data, { detailed_rates: detailed_rates, rates_length: Object.keys(response["data"]["rates"]).length, detailed_rates_length: detailed_rates.length });
        delete response_data.frankfurter_service_response_data.rates;

        await server_cache.del(currencies_node_cache_key);
        await get_or_compute_with_lock(
            currencies_node_cache_key,
            async () => {
                return response_data;
            },
            {
                cacheTTL: 86400,
                lockTTL: 180,
                waitTimeoutMs: 15000,
                pollEveryMs: 300,
                verbose: true 
            }
        ); 

        success = true;
        detail = "Frankfurter service executed successfully.";

    }catch(err){

        success = false;
        detail = err || "Frankfurter service error. ";

    }finally{
        var service_result = { success: success, transaction_date: new Date(), detail: detail, response_data };
        return service_result;
    }
};

async function control_currencies_node_cache(){

    var cached_currencies = await server_cache.get(currencies_node_cache_key);
    if( !cached_currencies ) await frankfurter_currencies_details();
};

control_currencies_node_cache();

module.exports = frankfurter_currencies_details;