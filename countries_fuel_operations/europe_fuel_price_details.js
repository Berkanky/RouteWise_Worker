const axios = require('axios');
const cheerio = require("cheerio");
const XLSX = require("xlsx");

//redis-cache
var server_cache = require("../cache.js");

//Şemalar
const CountryMeta = require("../Schemas/CountryMeta.js");

//Fonksiyonlar
var format_string_to_number = require("../MyFunctions/format_string_to_number.js");
var is_date = require("../MyFunctions/is_date.js");
var find_country = require("../MyFunctions/find_country.js");

var { EURO_STAT_OIL_URL, BACKEND_VERSION, FRANKFURTER_API_URL } = process.env;

if( !EURO_STAT_OIL_URL ) throw "EURO_STAT_OIL_URL required. ";
if( !BACKEND_VERSION ) throw "BACKEND_VERSION required. ";
if( !FRANKFURTER_API_URL ) throw "FRANKFURTER_API_URL required. ";

var country_currency_map_json = require("../meta_operations/country_currency_operations/country_currency_map.json");
if( !country_currency_map_json ) throw 'country_currency_map_json required. ';

async function convert_eur_to_usd(value){
    
    if( !value ) throw "value required. ";

    var currencies = await server_cache.get('currencies');
    if( !currencies ) throw "Currencies required in europe_fuel_price_details. ";

    var frankfurter_currencies_period_date = new Date(String(currencies?.frankfurter_service_response_data?.date));

    var detailed_rates = currencies?.frankfurter_service_response_data?.detailed_rates;

    var eur_currency_row = detailed_rates.find(function(item){ return item.CurrencyCode === 'EUR'});   
    if( !eur_currency_row ) throw "eur_currency_row required. ";

    var eur_currency_rate = eur_currency_row?.Rate;
    if( !eur_currency_rate ) throw "eur_currency_rate required. ";

    var eur_to_usd_rate = 1/eur_currency_rate;

    var converted_price_value_to_usd = (value * eur_to_usd_rate);

    return { converted_price_value_to_usd, eur_to_usd_rate, period: frankfurter_currencies_period_date };
};

async function download_euro_stat_xlsx_to_json(xlsx_url) {

    var res = await axios.get(xlsx_url, {
        responseType: "arraybuffer",
        headers: {
        "User-Agent": "RouteWiseBot/1.0 (+https://routewiseapp.com)",
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });

    var data = res.data;

    var workbook = XLSX.read(data, {
        type: "buffer",
    });

    var first_sheet_name = workbook.SheetNames[0];
    var sheet = workbook.Sheets[first_sheet_name];

    var rows = XLSX.utils.sheet_to_json(sheet, {
        defval: null,
        raw: false    
    });

    var year = new Date().getFullYear();
    var units = "$/L";
    var source = EURO_STAT_OIL_URL;
    var updated_date = new Date();
    var method = 'Programmatic Data Fetching';

    var default_obj = {
        Year: year,
        Units: units,
        Method: method,
        UpdatedDate: updated_date,
        BaseUnits: 'GAL',
        Source: source,
        BackendVersion: BACKEND_VERSION
    };

    var formatted_rows = [];

    for(var i = 0; i < rows.length; i++){

        var row = rows[i];

        var period_date;
        var country_name = row['in EUR'];
        if( is_date(country_name) ){

            var [day, month, year] = country_name.split("/");
            period_date = new Date(`${year}-${month}-${day}`);
        }

        var country_row = { 
            Name: country_name, 
            FuelPrices:[]
        };

        var { converted_price_value_to_usd, eur_to_usd_rate, period } = await convert_eur_to_usd(format_string_to_number(row['Euro-super 95  (I)'])/1000);

        var FX = {
            BaseCurrency: "EUR",
            QuoteCurrency: 'USD',
            Rate: eur_to_usd_rate,
            Source: FRANKFURTER_API_URL,
            Period: period
        };

        var gasoline_row = {
            Value: converted_price_value_to_usd,
            EnergyType: 'GASOLINE',
            Grade: 'gasoline',
            Period: period_date,
            FX: FX
        };

        var { converted_price_value_to_usd, eur_to_usd_rate, period } = await convert_eur_to_usd(format_string_to_number(row['Gas oil automobile Automotive gas oil Dieselkraftstoff (I)'])/1000);

        var diesel_row = {
            Value: converted_price_value_to_usd,
            EnergyType: 'DIESEL',
            Grade: 'diesel',
            Period: period_date,
            FX: FX
        };

        Object.assign(gasoline_row, default_obj);
        Object.assign(diesel_row, default_obj);

        country_row.FuelPrices.push(gasoline_row, diesel_row);

        if( !is_date(country_name) ) formatted_rows.push(country_row);
    };

    return formatted_rows;
};

async function update_country_meta_data(euro_stat_json){

    var countries_meta = await CountryMeta.find();

    for(var i = 0; i < euro_stat_json.length; i++){

        var row = euro_stat_json[i];
        var country_name = row['Name'];

        var existing_country = countries_meta.find(function(item){ return item.Name === country_name });
        
        if( !existing_country ){

            row.FuelPrices = row.FuelPrices.forEach(function(item){ item.CreatedDate = new Date() });

            var new_country_meta_data_obj = {
                Name: country_name,
                Code: find_country(country_name),
                UpdatedDate: new Date(),
                CurrencyCode: 'EUR',
                FuelPrices: row?.FuelPrices
            };

            var new_country_meta_data = new CountryMeta(new_country_meta_data_obj);

            await new_country_meta_data.save();
        }
        else if( existing_country ) {

            if( !existing_country.FuelPrices || existing_country.FuelPrices.length === 0){

                if( row.FuelPrices && row.FuelPrices.length ) {

                    row.FuelPrices.forEach(function(item){ item.CreatedDate = new Date() });

                    await CountryMeta.findByIdAndUpdate(
                        existing_country._id.toString(),
                        {
                            $push: { FuelPrices: { $each: row.FuelPrices } },
                            $set: { UpdatedDate: new Date() }
                        }
                    );
                }
            }
            else {
                
                for(var ci = 0; ci < (row.FuelPrices).length; ci++){
                    var fuel_data_row = row["FuelPrices"][ci];

                    var year = fuel_data_row.Year;
                    var energy_type = fuel_data_row.EnergyType;
                    var grade = fuel_data_row.Grade;

                    var country_meta_existing_fuel_price = existing_country.FuelPrices.find(function(item){ return item.Year === year && item.EnergyType === energy_type && item.Grade === grade  });
                    
                    if( country_meta_existing_fuel_price ){

                        country_meta_existing_fuel_price.UpdatedDate = new Date();
                        country_meta_existing_fuel_price.Value = fuel_data_row.Value;
                        country_meta_existing_fuel_price.Period = fuel_data_row.Period;
                        country_meta_existing_fuel_price.BackendVersion = BACKEND_VERSION;
                        country_meta_existing_fuel_price.FX = fuel_data_row.FX;

                        existing_country.UpdatedDate = new Date();

                        await existing_country.save();
                    }
                    else {

                        fuel_data_row.CreatedDate = new Date();

                        var country_meta_data_update = {
                            $push:{
                                FuelPrices: fuel_data_row
                            },
                            $set:{
                                UpdatedDate: new Date()
                            }
                        };

                        await CountryMeta.findByIdAndUpdate(existing_country._id.toString(), country_meta_data_update);
                    }
                };
            }
        }
    };
};

async function get_eurostat_fuel_prices_xlsx_url_string(){

    var res = await axios.get(EURO_STAT_OIL_URL, {
        headers: {
            "User-Agent": "RouteWiseBot/1.0 (+https://routewiseapp.com)"
        }
    });

    var html = res.data;
    var $ = cheerio.load(html);

    var download_href = null;

    $("div.ecl-file").each((i, el) => {
        var text = $(el).text().trim();

        if (text.toLowerCase().includes("prices with taxes")) {

            var link_el = $(el).find("a.ecl-file__download").first();
            var href = link_el.attr("href");
            if (href) download_href = href;
        }
    });

    if ( !download_href ) throw new Error('Could not find "Prices with taxes" XLSX download link on Eurostat page.');

    var url_obj = new URL(download_href, EURO_STAT_OIL_URL);
    var url_string = url_obj.toString();

    var euro_stat_json = await download_euro_stat_xlsx_to_json(url_string);
    if( !euro_stat_json ) throw "euro_stat_json required. ";
    
    await update_country_meta_data(euro_stat_json);

    return true;
};

async function europe_fuel_price_details(){
    await get_eurostat_fuel_prices_xlsx_url_string();
    console.log("The update of gasoline and diesel prices in European countries has been successfully completed. ");
};

module.exports = europe_fuel_price_details;