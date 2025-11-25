const axios = require('axios');
const cheerio = require("cheerio");
const XLSX = require("xlsx");

//redis-cache
var server_cache = require("../cache.js");

//Şemalar
const CountryMeta = require("../Schemas/CountryMeta.js");

//Fonksiyonlar
const format_string_to_number = require("../my_functions/format_string_to_number.js");
const is_date = require("../my_functions/is_date.js");
const find_country = require("../my_functions/find_country.js");

var { EURO_STAT_OIL_URL, BACKEND_VERSION } = process.env;

if( !EURO_STAT_OIL_URL ) throw "EURO_STAT_OIL_URL required. ";
if( !BACKEND_VERSION ) throw "BACKEND_VERSION required. ";

var country_currency_map_json = require("../meta_operations/country_currency_operations/country_currency_map.json");
if( !country_currency_map_json ) throw 'country_currency_map_json required. ';

async function convert_eur_to_usd(value){
    
    if( !value ) throw "value required. ";

    var currencies = await server_cache.get('currencies');
    if( !currencies ) throw "Currencies required. ";

    var detailed_rates = currencies?.frankfurter_service_response_data?.detailed_rates;

    var eur_currency_row = detailed_rates.find(function(item){ return item.CurrencyCode === 'EUR'});   
    if( !eur_currency_row ) throw "eur_currency_row required. ";

    var eur_currency_rate = eur_currency_row?.Rate;
    if( !eur_currency_rate ) throw "eur_currency_rate required. ";

    var for_calculate_rate = 1/eur_currency_rate;

    var converted_price_value_to_usd = (value * for_calculate_rate);

    return converted_price_value_to_usd;
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
    var period = new Date();
    var units = "$/L";
    //var grade = "gasoline";
    var source = EURO_STAT_OIL_URL; //"https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en";
    var created_date = new Date();
    var updated_date = new Date();
    var method = 'Programmatic Data Fetching';
    //var energy_type = 'GASOLINE';

    var default_obj = {
        Year: year,
        Period: period,
        Units: units,
        Method: method,
        CreatedDate: created_date,
        UpdatedDate: updated_date,
        BaseUnits: 'GAL',
        Source: source,
        BackendVersion: BACKEND_VERSION
    };

    var formatted_rows = [];

    for(var i = 0; i < rows.length; i++){
        var row = rows[i];

        var country_name = row['in EUR'];

        var country_row = { 
            Name: country_name, 
            FuelPrices:[]
        };

        var converted_gasoline_value = await convert_eur_to_usd(format_string_to_number(row['Euro-super 95  (I)'])/1000);
        var converted_diesel_value = await convert_eur_to_usd(format_string_to_number(row['Gas oil automobile Automotive gas oil Dieselkraftstoff (I)'])/1000);

        var gasoline_row = {
            Value: converted_gasoline_value,
            EnergyType: 'GASOLINE',
            Grade: 'gasoline',
        };

        var diesel_row = {
            Value: converted_diesel_value,
            EnergyType: 'DIESEL',
            Grade: 'diesel',
        };

        Object.assign(gasoline_row, default_obj);
        Object.assign(diesel_row, default_obj);

        country_row.FuelPrices.push(gasoline_row, diesel_row);

        if( is_date(country_name) ) continue;

        formatted_rows.push(country_row);
    };

    return formatted_rows;
};

async function migrade_country_meta_data(euro_stat_json){

    var countries_meta = await CountryMeta.find();

    for(var i = 0; i < euro_stat_json.length; i++){

        var row = euro_stat_json[i];
        var country_name = row['Name'];

        var existing_country = countries_meta.find(function(item){ return item.Name === country_name });
        
        if( !existing_country ){

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

                await CountryMeta.findByIdAndUpdate(
                    existing_country._id.toString(),
                    {
                        $push: { FuelPrices: { $each: row.FuelPrices } },
                        $set: { UpdatedDate: new Date() }
                    }
                );
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
                        country_meta_existing_fuel_price.Period = new Date();
                        country_meta_existing_fuel_price.BackendVersion = BACKEND_VERSION;

                        existing_country.UpdatedDate = new Date();

                        await existing_country.save();
                    }
                    else {

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

async function update_europe_country_meta_data(){

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

    await migrade_country_meta_data(euro_stat_json);

    return true;
};

async function europe_fuel_price_details(){
    await update_europe_country_meta_data();
    console.log("update_europe_country_meta_data completed. ");
};

module.exports = europe_fuel_price_details;