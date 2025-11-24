const axios = require('axios');

//Şemalar
const CountryMeta = require("../Schemas/CountryMeta");

//fonksiyonlar
const convert_gal_price_to_lt = require("../MyFunctions/convert_gal_price_to_lt");

var EIA_API_URL = process.env.EIA_API_URL;
var EIA_API_KEY = process.env.EIA_API_KEY;

if( !EIA_API_URL ) throw "EIA_API_URL required. ";
if( !EIA_API_KEY) throw "EIA_API_KEY required. ";

async function usa_fuel_price_details(){

    var params = {
        api_key: EIA_API_KEY,
        frequency: "weekly",
        data: ["value"],
        facets: {
            series: [
                "EMM_EPMR_PTE_NUS_DPG", // Regular - All formulations
                "EMM_EPMM_PTE_NUS_DPG", // Midgrade - All formulations
                "EMM_EPMP_PTE_NUS_DPG", // Premium - All formulations
                "EMD_EPD2D_PTE_NUS_DPG" // Diesel (U.S. No.2 On-Highway)
            ]
        },
        sort: [
            {
                column: "period",
                direction: "desc"
            }
        ],
        offset: 0,
        length: 10
    };

    var response = await axios.get(EIA_API_URL, { params: params });
    if( response.status !== 200) return {};

    var data =  response.data?.response?.data ?? [];

    if( !data.length ) return {};

    var latest_by_series = {};
    for (var item of data) { if (!latest_by_series[item.series]) latest_by_series[item.series] = { value: item.value, period: item.period, units: item.units }; }

    var latest_fuel_price_details = {
        "GASOLINE":{
            regular: { value: latest_by_series["EMM_EPMR_PTE_NUS_DPG"]?.value ?? null, period: latest_by_series["EMM_EPMR_PTE_NUS_DPG"]?.period ?? null, units: latest_by_series["EMM_EPMR_PTE_NUS_DPG"]?.units ?? null },
            midgrade: { value: latest_by_series["EMM_EPMM_PTE_NUS_DPG"]?.value ?? null, period: latest_by_series["EMM_EPMM_PTE_NUS_DPG"]?.period ?? null, units: latest_by_series["EMM_EPMM_PTE_NUS_DPG"]?.units ?? null },
            premium: { value: latest_by_series["EMM_EPMP_PTE_NUS_DPG"]?.value ?? null, period: latest_by_series["EMM_EPMP_PTE_NUS_DPG"]?.period ?? null, units: latest_by_series["EMM_EPMP_PTE_NUS_DPG"]?.units ?? null },
        },
        "DIESEL":{
            diesel: { value: latest_by_series["EMD_EPD2D_PTE_NUS_DPG"]?.value ?? null, period: latest_by_series["EMD_EPD2D_PTE_NUS_DPG"]?.period ?? null, units: latest_by_series["EMD_EPD2D_PTE_NUS_DPG"]?.units ?? null }
        }
    };

    var fuel_prices = [];
    var country_name = "United States";
    
    for(var key in latest_fuel_price_details){

        var Year, Value, Period, Units, EnergyType, Grade, value_gal;

        var row = latest_fuel_price_details[key];
        
        EnergyType = key;
        
        for(var child_key in row) {

            var child_row = row[child_key];

            Year = new Date(child_row["period"]).getFullYear();
            value_gal = Number(child_row["value"]);
            Value = convert_gal_price_to_lt(value_gal, { gallon: 'us', decimals: 3, currency: 'USD' }).unformatted_liter;
            Period = new Date(child_row["period"]);
            Units =  "$/L"; //child_row["units"];
            Grade = child_key;

            fuel_prices.push({Year, Value, Period, Units, EnergyType, Grade, value_gal });
        }
    }
    
    var usa_country_meta_data_filter = { Name: country_name };
    var usa_country_meta_data = await CountryMeta.findOne(usa_country_meta_data_filter);

    for(var i = 0; i < fuel_prices.length; i++){

        var row = fuel_prices[i];

        var fuel_price_data_row = usa_country_meta_data["FuelPrices"].find(function(item){ return item.Year == row.Year && item.Units == row.Units && item.EnergyType == row.EnergyType && item.Grade == row.Grade});
        if(fuel_price_data_row){

            fuel_price_data_row.Value = row.Value;
            fuel_price_data_row.UpdatedDate = new Date();
            fuel_price_data_row.Period = new Date(String(row.Period));

            usa_country_meta_data.UpdatedDate = new Date();

            await usa_country_meta_data.save();

            continue;
        }
        else {

            var new_fuel_price_data = {
                Year: new Date().getFullYear(),
                Value: row.Value,
                Period: new Date(String(row.Period)),
                Units: row.Units,
                EnergyType: row.EnergyType,
                Grade: row.Grade,
                Method: "API",
                Source: process.env.EIA_API_SOURCE
            };
                
            var country_meta_update = {
                $push:{
                    FuelPrices: new_fuel_price_data
                },
                $set:{
                    UpdatedDate: new Date()
                }
            };

            await CountryMeta.findByIdAndUpdate(usa_country_meta_data._id.toString(), country_meta_update);
            continue;
        }
    };

    return true;
};

module.exports = usa_fuel_price_details;