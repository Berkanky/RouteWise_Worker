const cron = require('node-cron');

//Ülkelerin benzin - dizel fiyatlarının operasyonları. 
var usa_fuel_price_details = require("./usa_fuel_price_details"); //0 10 * * 1
var europe_fuel_price_details = require("./europe_fuel_price_details"); //0 10 * * 1
var canada_fuel_price_details = require("./canada_fuel_price_details"); //0 10 * * 1

//Sistem operasyonları.
var { set_expired_shared_links_active_status, delete_temporary_accounts } = require("../delayed_operations/operations"); //Her saat başı ->  0 * * * * 

//Cache işlemleri operasyonları.
var fuel_price_details = require("./fuel_price_details_cache_operation"); //Her pazartesi Sabah 10 -> 0 10 * * 1
var frankfurter_currencies_details = require("./currencies_cache_operation"); //Her gün akşam 18:00'da -> 0 18 * * *

cron.schedule('0 10 * * 1', async () => {
  try{
    await usa_fuel_price_details();
    await europe_fuel_price_details();
    await canada_fuel_price_details();
    
    //Üsttekiler CountryMeta tablosunda gerekli alanları update eder ve sonra alttaki cache yapar.
    await fuel_price_details();
    
  }catch(err){
    console.log(err);
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});

cron.schedule('0 * * * * ', async () => {
  try{
    await set_expired_shared_links_active_status();
    await delete_temporary_accounts();
  }catch(err){
    console.log(err);
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});

cron.schedule('0 18 * * *', async () => {
  try{
    //DB'de tutulmaz, sadece cache.
    await frankfurter_currencies_details();
  }catch(err){
    console.log(err);
  }
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});