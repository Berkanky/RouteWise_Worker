const FormatNumber = require("./FormatNumber");

function convert_gal_price_to_lt(pricePerGallon, opts) {
    
  var LITERS_PER_GALLON = {
    us: 3.785411784,
    imperial: 4.54609,
  };

  var { gallon = "us", decimals = 3, currency = "USD" } = opts;

  if ( typeof pricePerGallon !== "number" || !isFinite(pricePerGallon) || pricePerGallon < 0 ) return null;

  var per = LITERS_PER_GALLON[gallon];
  if (!per) return null;

  var pricePerLiter = pricePerGallon / per;

  var converted_gal_to_lt_rounded_val = Math.round(pricePerLiter * Math.pow(10, decimals)) / Math.pow(10, decimals);
  var converted_gal_to_lt_rounded_val_formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(pricePerLiter);

  converted_gal_to_lt_rounded_val_formatted = converted_gal_to_lt_rounded_val_formatted + ' / L';

  return { liter: FormatNumber(converted_gal_to_lt_rounded_val), formatted_liter: converted_gal_to_lt_rounded_val_formatted, unformatted_liter: converted_gal_to_lt_rounded_val };
}

module.exports = convert_gal_price_to_lt;
