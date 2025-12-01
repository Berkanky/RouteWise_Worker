const axios = require('axios');
const cheerio = require("cheerio");

//redis-cache
var server_cache = require("../cache.js");

//Şemalar
const CountryMeta = require("../Schemas/CountryMeta.js");

var { NRCAN_GASOLINE_URL, NRCAN_DIESEL_URL, BACKEND_VERSION, FRANKFURTER_API_URL} = process.env;

if( !NRCAN_GASOLINE_URL ) throw "NRCAN_GASOLINE_URL required. ";
if( !NRCAN_DIESEL_URL ) throw "NRCAN_DIESEL_URL required. ";
if( !BACKEND_VERSION ) throw "BACKEND_VERSION required. ";
if( !FRANKFURTER_API_URL ) throw "FRANKFURTER_API_URL required. ";

var current_year = new Date().getFullYear();

NRCAN_GASOLINE_URL = NRCAN_GASOLINE_URL + current_year;
NRCAN_DIESEL_URL = NRCAN_DIESEL_URL + current_year;

var country_currency_map_json = require("../meta_operations/country_currency_operations/country_currency_map.json");
if( !country_currency_map_json ) throw 'country_currency_map_json required. ';

async function get_canada_gasoline_prices_detail(){

    var res = await axios.get(NRCAN_GASOLINE_URL, {
        headers: {
        "User-Agent": "RouteWiseBot/1.0 (+https://routewiseapp.com)"
        }
    });

    var $ = cheerio.load(res.data);

    var table = $("#pricesTable");
    if (!table.length) throw new Error("pricesTable bulunamadı.");

    var last_row = table.find("tbody tr").last();
    if (!last_row.length) throw new Error("tbody içinde tr yok.");
    
    var cell = last_row.find(
        'td[headers="header4_1_1 header3_1 header1"]'
    ).first();

    if (!cell.length) throw new Error("İstenen headers değerine sahip hücre bulunamadı.");

    var date_cell = last_row.find(
        'td[headers="headerDate empty header1"]'
    ).first();

    if (!date_cell.length) throw new Error("İstenen headers değerine sahip hücre bulunamadı.");
    var period_date = new Date(date_cell.text().trim());

    var cent_value = Number(cell.text().trim()); //cents per litre. 144.7	
    var cad_per_litre = cent_value / 100; //cad_per_litre 1.4469999999999998

    var currencies = await server_cache.get("currencies");
    if( !currencies ) throw "currencies required canada_fuel_price_details gasoline. ";

    var frankfurter_currencies_period_date = new Date(String(currencies?.frankfurter_service_response_data?.date));

    var detailed_rates = currencies?.frankfurter_service_response_data?.detailed_rates;
    if( !detailed_rates.length ) throw "detailed_rates required. ";

    var cad_currency_code = "CAD";

    var cad_rate_detail = detailed_rates.find(function(item){ return item.CurrencyCode === cad_currency_code });
    if( !cad_rate_detail ) throw "cad_rate_detail required. ";

    var usd_to_cad_rate = cad_rate_detail.Rate; //usd_to_cad_rate 1.4085
    var cad_to_usd_rate = 1 / usd_to_cad_rate; //cad_to_usd_rate 0.7099751508697195

    var usd_per_litre = cad_per_litre * cad_to_usd_rate; //usd_per_litre 1.027334043308484

    var FX = {
        BaseCurrency: cad_currency_code,
        QuoteCurrency: 'USD',
        Rate: cad_to_usd_rate,
        Source: FRANKFURTER_API_URL,
        Period: frankfurter_currencies_period_date
    };

    var cad_gasoline_data = {
        Source: NRCAN_GASOLINE_URL,
        Grade: "gasoline",
        EnergyType: "GASOLINE",
        Value: usd_per_litre,
        Period: period_date,
        FX: FX
    };

    return cad_gasoline_data;
};

async function get_canada_diesel_prices_detail(){

    var res = await axios.get(NRCAN_DIESEL_URL, {
        headers: {
        "User-Agent": "RouteWiseBot/1.0 (+https://routewiseapp.com)"
        }
    });

    var $ = cheerio.load(res.data);

    var table = $("#pricesTable");
    if (!table.length) throw new Error("pricesTable bulunamadı.");

    var last_row = table.find("tbody tr").last();
    if (!last_row.length) throw new Error("tbody içinde tr yok.");
    
    var cell = last_row.find(
        'td[headers="header4_1_1 header3_1 header1"]'
    ).first();

    if (!cell.length) throw new Error("İstenen headers değerine sahip hücre bulunamadı.");

    var date_cell = last_row.find(
        'td[headers="headerDate empty header1"]'
    ).first();

    if (!date_cell.length) throw new Error("İstenen headers değerine sahip hücre bulunamadı.");
    var period_date = new Date(date_cell.text().trim());

    var cent_value = Number(cell.text().trim()); //cents per litre. 144.7	
    var cad_per_litre = cent_value / 100; //cad_per_litre 1.4469999999999998

    var currencies = await server_cache.get("currencies");
    if( !currencies ) throw "currencies required canada_fuel_price_details diesel. ";

    var frankfurter_currencies_period_date = new Date(String(currencies?.frankfurter_service_response_data?.date));

    var detailed_rates = currencies?.frankfurter_service_response_data?.detailed_rates;
    if( !detailed_rates.length ) throw "detailed_rates required. ";

    var cad_currency_code = "CAD";

    var cad_rate_detail = detailed_rates.find(function(item){ return item.CurrencyCode === cad_currency_code });
    if( !cad_rate_detail ) throw "cad_rate_detail required. ";

    var usd_to_cad_rate = cad_rate_detail.Rate; //usd_to_cad_rate 1.4085
    var cad_to_usd_rate = 1 / usd_to_cad_rate; //cad_to_usd_rate 0.7099751508697195

    var usd_per_litre = cad_per_litre * cad_to_usd_rate; //usd_per_litre 1.027334043308484

    var FX = {
        BaseCurrency: cad_currency_code,
        QuoteCurrency: 'USD',
        Rate: cad_to_usd_rate,
        Source: FRANKFURTER_API_URL,
        Period: frankfurter_currencies_period_date
    };

    var cad_diesel_data = {
        Source: NRCAN_DIESEL_URL,
        Grade: "diesel",
        EnergyType: "DIESEL",
        Value: usd_per_litre,
        Period: period_date,
        FX: FX
    };

    return cad_diesel_data;
};

async function update_canada_country_meta_data(){

    var country_meta_data_filter = { Name: 'Canada' };
    var country_meta_data = await CountryMeta.findOne(country_meta_data_filter).select('Name FuelPrices');

    if( !country_meta_data ) return;

    var year = new Date().getFullYear();
    var units = "$/L";
    var created_date = new Date();
    var updated_date = new Date();
    var method = 'Programmatic Data Fetching';

    var canada_fuel_price_data_default = {
        Year: year,
        Units: units,
        Method: method,
        UpdatedDate: updated_date,
        BaseUnits: 'GAL',
        BackendVersion: BACKEND_VERSION
    };

    var cad_gasoline_data = await get_canada_gasoline_prices_detail();
    var cad_diesel_data = await get_canada_diesel_prices_detail();

    if( !cad_gasoline_data ) throw "cad_gasoline_data required. ";
    if( !cad_diesel_data ) throw "cad_diesel_data required. ";

    Object.assign(cad_gasoline_data, canada_fuel_price_data_default);
    Object.assign(cad_diesel_data, canada_fuel_price_data_default);

    var cad_fuel_prices = [];
    cad_fuel_prices.push(cad_gasoline_data, cad_diesel_data);

    for(var i = 0; i < cad_fuel_prices.length; i++){

        var fuel_price_data = cad_fuel_prices[i];

        var year = fuel_price_data.Year;
        var grade = fuel_price_data.Grade;
        var units = fuel_price_data.Units;
        var energy_type = fuel_price_data.EnergyType;
        var period = fuel_price_data.Period;

        if( country_meta_data.FuelPrices ) {
            
            var existing_fuel_price_data = country_meta_data.FuelPrices.find(function(item){ return item.Year === year && item.Grade === grade && item.Units === units && item.EnergyType === energy_type });
            if( existing_fuel_price_data ) {

                existing_fuel_price_data.Value = fuel_price_data.Value;
                existing_fuel_price_data.UpdatedDate = updated_date;
                existing_fuel_price_data.Period = period;
                existing_fuel_price_data.BackendVersion = BACKEND_VERSION;
                existing_fuel_price_data.FX = fuel_price_data.FX;

                country_meta_data.UpdatedDate = updated_date;

                await country_meta_data.save();

                continue;
            } else {

                Object.assign(fuel_price_data, { CreatedDate: created_date });

                var country_meta_data_insert = {
                    $push: { FuelPrices: fuel_price_data }
                };

                await CountryMeta.findByIdAndUpdate(country_meta_data._id.toString(), country_meta_data_insert);
                continue;
            }
        }else{

            Object.assign(fuel_price_data, { CreatedDate: created_date });

            var country_meta_data_insert = {
                $push: { FuelPrices: fuel_price_data }
            };

            await CountryMeta.findByIdAndUpdate(country_meta_data._id.toString(), country_meta_data_insert);
            continue;
        }
    };
    return true;
};

async function canada_fuel_price_details(){
    await update_canada_country_meta_data();
    console.log("The update of gasoline and diesel prices in Canada has been successfully completed. ");
};

module.exports = canada_fuel_price_details;