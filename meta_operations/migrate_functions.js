const cron = require('node-cron');
const axios = require('axios');

//FS
const fs = require("fs");

//Şemalar
const CountryMeta = require("../Schemas/CountryMeta");

//Diesel price production.
const estimate_diesel_for_country = require('./dieselEstimator');

//fuel_price_list json
var fuel_prices_list_json = require("./fuel_price_list.json");


async function clean_country_meta_data_fuelprices(){

    var country_meta_array = await CountryMeta.find().lean();
    var counter = 0;
    for(var i = 0; i < country_meta_array.length; i++){

        var country_meta_data = country_meta_array[i];
        var updated_country_meta = await CountryMeta.findByIdAndUpdate(country_meta_data._id.toString(), { $unset:{ FuelPrices: [] }});
        if( updated_country_meta) counter += 1;
    }

    console.log("Cleaned ContryMeta Data Row Count : " + counter);
};

function best_country_match(input, dbCountries) {
  var ALIASES = {
    "turkiye": "Türkiye",
    "czech republic": "Czechia",
    "viet nam": "Vietnam",
    "syrian arab republic": "Syria",
    "iran islamic republic": "Iran",
    "iran islamic republic of": "Iran",
    "russian federation": "Russia",
    "lao peoples democratic republic": "Laos",
    "korea republic of": "South Korea",
    "korea democratic peoples republic of": "North Korea",
    "united states of america": "United States",
    "tanzania united republic of": "Tanzania",
    "bolivia plurinational state of": "Bolivia",
    "palestine state of": "Palestine",
    "myanmar": "Burma"
  };

  var GENERIC = new Set([
    "republic","rep","democratic","islamic","arab","people","peoples",
    "federation","federated","union","state","states","united","kingdom",
    "of","the","and","islands","island","bolivarian","plurinational"
  ]);

  var norm = s => String(s||"")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu,"")
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
  var tok = s => norm(s.replace(/,/g,""))
    .split(" ")
    .filter(t => t && !GENERIC.has(t) && t.length > 2);

  var nIn = norm(input);
  var aliased = ALIASES[nIn] || input;

  var exact = dbCountries.find(x => norm(x) === norm(aliased));
  if (exact) return { ok: true, name: exact, score: 1, method: "exact" };

  var qa = tok(aliased);
  if (!qa.length) return { ok: false, name: null, score: 0 };

  var best = null, bestScore = 0;
  var a0 = norm(aliased)[0]; // ilk harf freni

  for (var m of dbCountries) {
    var mNorm = norm(m);
    if (a0 && mNorm && a0 !== mNorm[0]) continue;

    var mb = tok(m);
    if (!mb.length) continue;

    var inter = qa.filter(t => mb.includes(t)).length;
    var uni = new Set([...qa, ...mb]).size || 1;
    var s = inter / uni;
    if (qa.some(t => t.length >= 4 && mb.includes(t))) s += 0.05;

    if (s > bestScore) { bestScore = s; best = m; }
  }

  return bestScore >= 0.75
    ? { ok: true, name: best, score: bestScore, method: "tokens" }
    : { ok: false, name: null, score: bestScore, method: "none" };
};

async function country_meta_countries(dbCountries, failed_insert_process){
  for (var row of failed_insert_process) {

    var input = row.country_name || row.CountryName || "";
    var match = best_country_match(input, dbCountries);

    if (match.ok) {

      row.country_name = match.name;
      return { success: true, matched_country_Name: match.name };
      
    } else return { success: false, bestScore: match.score };
  }
};

async function migrade_fuel_prices(){
    var countries = await CountryMeta.find().select("Name").lean();

    var dbCountries = countries.map(function(item){ return item["Name"]});
    console.log("dbCountries : " + JSON.stringify(dbCountries));
    console.log("Fuel Prices Migrade Process Started ->> " + new Date());

    var formatted_fuel_prices_list = [];

    var group_by_country_fuel_prices_list = [];
    for(var i = 0; i < fuel_prices_list_json.length; i++){

        var Name, Year, Value, Period, Units, EnergyType, Grade, Source;

        var row = fuel_prices_list_json[i];
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

    group_by_country_fuel_prices_list = estimate_diesel_for_country(group_by_country_fuel_prices_list);

    var updated_row_count = 0;
    var failed_insert_process = [];
    var successful_insert_process = [];
    var failed_insert_process_matched_in_db = [];
    for(var i = 0; i < group_by_country_fuel_prices_list.length; i++){

        var row = group_by_country_fuel_prices_list[i];
        var country_name = row["country_name"];

        var country_meta_filter = { Name: country_name };
        var country_meta = await CountryMeta.findOne(country_meta_filter);
        if( !country_meta ) {
            
            var { success, matched_country_Name } = await country_meta_countries(dbCountries, failed_insert_process=[row]);

            if( !success ) {

                failed_insert_process.push(row);
                continue;
            }

            country_meta = await CountryMeta.findOne({ Name: matched_country_Name });
            failed_insert_process_matched_in_db.push(row);
        }

        for(var ci = 0; ci < row.gasoline_prices.length; ci++){

            var child_row = row["gasoline_prices"][ci];
            var gasoline_price_year = Object.keys(child_row)[0];

            child_row = child_row[gasoline_price_year];

            var country_meta_update = {
                $push:{ FuelPrices: child_row }
            };
            var updated_country_meta = await CountryMeta.findByIdAndUpdate(country_meta._id.toString(), country_meta_update);
            if( !updated_country_meta ) continue;
        };

        for(var ci = 0; ci < row.diesel_prices.length; ci++){

            var child_row = row["diesel_prices"][ci];
            var diesel_price_year = Object.keys(child_row)[0];

            child_row = child_row[diesel_price_year];

            var country_meta_update = {
                $push:{ FuelPrices: child_row }
            };
            var updated_country_meta = await CountryMeta.findByIdAndUpdate(country_meta._id.toString(), country_meta_update);
            if( !updated_country_meta ) continue;
        };

        successful_insert_process.push(row);
        updated_row_count = updated_row_count + 1;
    };

    console.log("updated_row_count : " + updated_row_count);
    console.log("Failed Insert Process Count -> " + failed_insert_process.length + JSON.stringify(failed_insert_process));
    console.log("Successfull Insert Process Count -> " + successful_insert_process.length + JSON.stringify(successful_insert_process));
    console.log("Matched Insert Process Count -> " + failed_insert_process_matched_in_db.length + JSON.stringify(failed_insert_process_matched_in_db));

    var fuel_prices_inserted_rows = await CountryMeta.find({
        FuelPrices: { $exists: true, $not: { $size: 0 } }
    });

    console.log("fuel_prices_inserted_rows Count -> " + fuel_prices_inserted_rows.length);

    return;
};

async function migrade_currencies(){
    
    var currencies = JSON.parse(fs.readFileSync(__dirname + "/country_currency_map.json", "utf8"));
    currencies = currencies.filter(function(item){ return item.CurrencyCode });

    var country_meta = await CountryMeta.find().lean();

    var updated_count = 0;
    for(var i = 0; i < country_meta.length; i++){
        var country_name = country_meta[i]["Name"];

        var existing_currency_data = currencies.find(function(item){ return item.Name === country_name });
        if( !existing_currency_data ) continue;

        var currency_code = existing_currency_data["CurrencyCode"];

        var country_meta_filter = { Name: country_name };
        var country_meta_update = {
            $set: { CurrencyCode: currency_code }
        };

        var updated_country_meta = await CountryMeta.findOneAndUpdate(country_meta_filter, country_meta_update);
        if( !updated_country_meta ) continue;

        updated_count = updated_count + 1;
    };
};