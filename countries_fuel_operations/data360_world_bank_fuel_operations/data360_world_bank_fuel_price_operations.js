const CountryMeta = require("../../Schemas/CountryMeta");
const fs = require("fs");
const path = require("path");

var calculate_estimate_diesel_for_country = require('./calculate_estimate_diesel_for_country');
var matched_country_meta_countries = require("../../my_functions/matched_country_meta_countries");

var data360_world_bank_fuel_prices = require("./data360_world_bank_fuel_prices.json");

async function clean_country_meta_data_fuelprices(){

    var country_meta_array = await CountryMeta.find().lean();

    for(var i = 0; i < country_meta_array.length; i++){

        var country_meta_data = country_meta_array[i];
        await CountryMeta.findByIdAndUpdate(country_meta_data._id.toString(), { $unset:{ FuelPrices: [] }});
    };
};

async function migrade_fuel_prices(){

    var countries = await CountryMeta.find().select("Name").lean();
    var dbCountries = countries.map(function(item){ return item["Name"]});

    var formatted_fuel_prices_list = [];

    var group_by_country_fuel_prices_list = [];
    for(var i = 0; i < data360_world_bank_fuel_prices.length; i++){

        var Name, Year, Value, Period, Units, EnergyType, Grade, Source;

        var row = data360_world_bank_fuel_prices[i];
        Name = Object.keys(row)[0];
        for(var key in row[Name]){

            var child_row = row[Name][key];

            Year = key;

            for( var child_key in child_row) {
                var child_row_2 = child_row[child_key];
                EnergyType = child_key;

                for(var child_key_2 in child_row_2){
                    var child_row_3 = child_row_2[child_key_2];

                    Grade = child_key_2;
                    Value = child_row_3["value"];
                    Period = child_row_3["period"];
                    Units = child_row_3["units"];
                    Source = "EIA.gov";

                    var country_meta_fuel_price_data = { Name, Year, Value, Period, Units, EnergyType, Grade };
                    formatted_fuel_prices_list.push(country_meta_fuel_price_data);
                }
            }
        }
    };

    for(var i = 0; i < formatted_fuel_prices_list.length; i++){

        var row = formatted_fuel_prices_list[i];

        var is_country_existing = group_by_country_fuel_prices_list.find(function(item){ return item.country_name === row.Name });
        if( is_country_existing ) {
            is_country_existing.gasoline_prices.push({ [row.Period]: row });
            continue;
        } else {
            group_by_country_fuel_prices_list.push({ country_name: row.Name, gasoline_prices: [ { [row.Period]: row } ] });
            continue;
        }
    };

    group_by_country_fuel_prices_list = calculate_estimate_diesel_for_country(group_by_country_fuel_prices_list);
    
    for(var i = 0; i < group_by_country_fuel_prices_list.length; i++){

        var row = group_by_country_fuel_prices_list[i];
        var country_name = row["country_name"];

        var country_meta_filter = { Name: country_name };
        var country_meta = await CountryMeta.findOne(country_meta_filter);

        if( !country_meta ) {
            
            var { success, matched_country_Name } = await matched_country_meta_countries(dbCountries, failed_insert_process=[row]);

            if( !success ) continue;

            country_meta = await CountryMeta.findOne({ Name: matched_country_Name });
        }

        for(var ci = 0; ci < row.gasoline_prices.length; ci++){

            var child_row = row["gasoline_prices"][ci];
            var gasoline_price_year = Object.keys(child_row)[0];

            child_row = child_row[gasoline_price_year];

            var country_meta_update = {
                $push:{ FuelPrices: child_row }
            };
            await CountryMeta.findByIdAndUpdate(country_meta._id.toString(), country_meta_update);
        };

        for(var ci = 0; ci < row.diesel_prices.length; ci++){

            var child_row = row["diesel_prices"][ci];
            var diesel_price_year = Object.keys(child_row)[0];

            child_row = child_row[diesel_price_year];

            var country_meta_update = {
                $push:{ FuelPrices: child_row }
            };
            await CountryMeta.findByIdAndUpdate(country_meta._id.toString(), country_meta_update);
        };
    };

    return;
};

async function backup_country_meta_data(){

    var db_countries = await CountryMeta.find().select("Name Code DialCode CurrencyCode TollPassEnums FuelPrices");
    var default_countries_json = [];

    for (var obj of db_countries) {
        if( !obj.Name ) continue;

        var default_country_obj = { 
            Name: obj.Name, 
            Code: obj?.Code || '-', 
            DialCode: obj?.DialCode || '-', 
            CurrencyCode: obj?.CurrencyCode || '-', 
            TollPassEnums: obj.TollPassEnums && obj.TollPassEnums.length ?  obj.TollPassEnums : [],
            FuelPrices: obj.FuelPrices && obj.FuelPrices.length ?  obj.FuelPrices : []
        };

        default_countries_json.push(default_country_obj);
    };

    var d = new Date();

    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var day = d.getDate();

    if( month < 10 ) month = '0' + month;
    if( day < 10 ) day = '0' + day;

    var file_date_detail = year + '.' + month + '.' + day;

    var file_name = 'RouteWise_' + file_date_detail + '.json';
    var filePath = path.join(__dirname, "..", "..", "route_wise_backup", file_name);  

    fs.writeFileSync(filePath, JSON.stringify(default_countries_json, null, 2), "utf8");
    console.log("backup_country_meta_data completed. ");
    return;
};

module.exports = { backup_country_meta_data };