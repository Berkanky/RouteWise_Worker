const CountryMeta = require('../Schemas/CountryMeta');

async function get_country_meta_data(){
  var country_meta_data = await CountryMeta.find().select("Name FuelPrices").lean();
  return country_meta_data;
};

module.exports = get_country_meta_data;