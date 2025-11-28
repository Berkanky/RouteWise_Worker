var best_country_match = require("./best_country_match");

async function matched_country_meta_countries(dbCountries, failed_insert_process){
  for (var row of failed_insert_process) {

    var input = row.country_name || row.CountryName || "";
    var match = best_country_match(input, dbCountries);

    if (match.ok) {

      row.country_name = match.name;
      return { success: true, matched_country_Name: match.name };
      
    } else return { success: false, bestScore: match.score };
  }
};

module.exports = matched_country_meta_countries;