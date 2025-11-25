const cron = require('node-cron');

//Ülkelerin benzin - dizel fiyatlarının operasyonları. 
var usa_fuel_price_details = require("../countries_fuel_operations/usa_fuel_price_details"); //0 10 * * 1
var europe_fuel_price_details = require("../countries_fuel_operations/europe_fuel_price_details"); //0 10 * * 1
var canada_fuel_price_details = require("../countries_fuel_operations/canada_fuel_price_details"); //0 10 * * 1

//Sistem operasyonları.
var routewise_system_operations = require("../routewise_system_operations/index"); //Her saat başı ->  0 * * * * 

//Cache işlemleri operasyonları.
var country_meta_data_cache_operation = require("../cache_operations/country_meta_data_cache_operation"); //Her pazartesi Sabah 10 -> 0 10 * * 1
var frankfurter_service_response_cache_operation = require("../cache_operations/frankfurter_service_response_cache_operation"); //Her gün akşam 18:00'da -> 0 18 * * *

var { NODE_ENV } = process.env;
if( !NODE_ENV ) throw 'Required NODE_ENV. ';

var is_cron_test_active = false;

var cron_general_date_dev_test = '* * * * *';

var crond_1_date_prod = '0 10 * * 1';
cron.schedule(is_cron_test_active == true ? cron_general_date_dev_test : crond_1_date_prod, async () => {
  try{
    await usa_fuel_price_details();
    await europe_fuel_price_details();
    await canada_fuel_price_details();
    
    //Üsttekiler CountryMeta tablosunda gerekli alanları update eder ve sonra alttaki cache yapar.
    await country_meta_data_cache_operation();

  }catch(err){
    console.log(err);
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});

var cron_2_date_prod = '0 * * * *';
cron.schedule(is_cron_test_active == true ? cron_general_date_dev_test : cron_2_date_prod, async () => {
  try{
    await routewise_system_operations();
  }catch(err){
    console.log(err);
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});

var cron_date_3_prod = '0 18 * * *';
cron.schedule(is_cron_test_active == true ? cron_general_date_dev_test : cron_date_3_prod, async () => {
  try{
    await frankfurter_service_response_cache_operation();
  }catch(err){
    console.log(err);
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});