const cron = require('node-cron');

//Ülkelerin benzin - dizel fiyatlarının operasyonları. 
var usa_fuel_price_details = require("../countries_fuel_operations/usa_fuel_price_details"); //0 10 * * 1
var europe_fuel_price_details = require("../countries_fuel_operations/europe_fuel_price_details"); //0 10 * * 1
var canada_fuel_price_details = require("../countries_fuel_operations/canada_fuel_price_details"); //0 10 * * 1

//Sistem operasyonları.
var routewise_system_operations = require("../routewise_system_operations/index"); //Her saat başı ->  0 * * * * 

//Cache işlemleri operasyonları.
var set_country_meta_data_cache = require("../cache_operations/country_meta_data_cache_operation"); //Her pazartesi Sabah 10 -> 0 10 * * 1
var set_currencies_node_cache = require("../cache_operations/frankfurter_service_response_cache_operation"); //Her gün akşam 18:00'da -> 0 18 * * *

//Fonksiyonlar.
var { diff_countries_snapshots } = require("../MyFunctions/diff_checker_functions");
var get_country_meta_data = require("../MyFunctions/get_country_meta_data");
var create_country_meta_data_report = require("../insert_functions/create_grid_fs");

var { NODE_ENV } = process.env;
if( !NODE_ENV ) throw 'Required NODE_ENV. ';

var is_cron_test_active = false;

var cron_general_date_dev_test = '* * * * *';
var crond_1_date_prod = '0 10 * * 1';

async function init_cron_jobs(app){

  cron.schedule(is_cron_test_active == true ? cron_general_date_dev_test : crond_1_date_prod, async () => {

    try{

      var before_update_country_meta_data = await get_country_meta_data(); //Update başlamadan önceki country_meta_data.

      await usa_fuel_price_details();
      await europe_fuel_price_details();
      await canada_fuel_price_details();
          
      //Üsttekiler CountryMeta tablosunda gerekli alanları update eder ve sonra alttaki cache yapar.
      await set_country_meta_data_cache();

      var after_update_country_meta_data = await get_country_meta_data(); //Update başladıktan sonraki country_meta_data.

      var diff_countries_snapshots_results = diff_countries_snapshots(before_update_country_meta_data, after_update_country_meta_data);
      var { success, id, length, filename, metadata } = await create_country_meta_data_report(app, diff_countries_snapshots_results);

  return true;
      
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
      await set_currencies_node_cache();
    }catch(err){
      console.log(err);
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Istanbul'
  });
};

module.exports = init_cron_jobs;