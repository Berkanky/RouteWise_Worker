function find_country(country_name) {

  country_name = country_name.toLowerCase();

  var is_existing = country_currency_map_json.find(row =>
    row.Name.toLowerCase().includes(country_name)
  );

  if( !is_existing ) return null;

  return is_existing.CurrencyCode;
};

module.exports = find_country;