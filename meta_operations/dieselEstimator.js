var REGION_DEFAULTS = {
  EU: 1.03,
  NA: 1.05,   // North America
  MENA: 0.98, // Middle East & North Africa
  APAC: 1.01, // Asia‑Pacific
  SSA: 0.99,  // Sub‑Saharan Africa
  LATAM: 1.02 // Latin America & Caribbean
};

var COUNTRY_OVERRIDES = {
  "Denmark": 1.03,
  "United Kingdom": 1.03,
  "United States": 1.07,
  "Germany": 1.03,
  "United Arab Emirates": 0.98
};

var COUNTRY_TO_REGION = {
  "Angola": "SSA",
  "Albania": "EU",
  "United Arab Emirates": "MENA",
  "Argentina": "LATAM",
  "Armenia": "MENA",
  "Australia": "APAC",
  "Austria": "EU",
  "Azerbaijan": "MENA",
  "Belgium": "EU",
  "Benin": "SSA",
  "Bangladesh": "APAC",
  "Bulgaria": "EU",
  "Bahrain": "MENA",
  "Bosnia and Herzegovina": "EU",
  "Bolivia": "LATAM",
  "Brazil": "LATAM",
  "Barbados": "LATAM",
  "Botswana": "SSA",
  "Canada": "NA",
  "Switzerland": "EU",
  "Chile": "LATAM",
  "China": "APAC",
  "Cote d'Ivoire": "SSA",
  "Cameroon": "SSA",
  "Colombia": "LATAM",
  "Costa Rica": "LATAM",
  "Cyprus": "EU",
  "Czechia": "EU",
  "Germany": "EU",
  "Denmark": "EU",
  "Dominican Republic": "LATAM",
  "Algeria": "MENA",
  "Ecuador": "LATAM",
  "Egypt, Arab Rep.": "MENA",
  "Spain": "EU",
  "Estonia": "EU",
  "Finland": "EU",
  "France": "EU",
  "United Kingdom": "EU",
  "Georgia": "EU",
  "Ghana": "SSA",
  "Greece": "EU",
  "Guatemala": "LATAM",
  "Honduras": "LATAM",
  "Croatia": "EU",
  "Hungary": "EU",
  "Indonesia": "APAC",
  "India": "APAC",
  "Ireland": "EU",
  "Iran, Islamic Rep.": "MENA",
  "Iceland": "EU",
  "Israel": "MENA",
  "Italy": "EU",
  "Jamaica": "LATAM",
  "Jordan": "MENA",
  "Japan": "APAC",
  "Kazakhstan": "APAC",
  "Kenya": "SSA",
  "Kyrgyz Republic": "APAC",
  "Cambodia": "APAC",
  "Korea, Rep.": "APAC",
  "Kuwait": "MENA",
  "Lao PDR": "APAC",
  "Lebanon": "MENA",
  "Lithuania": "EU",
  "Luxembourg": "EU",
  "Latvia": "EU",
  "Morocco": "MENA",
  "Moldova": "EU",
  "Mexico": "LATAM",
  "North Macedonia": "EU",
  "Mali": "SSA",
  "Malta": "EU",
  "Montenegro": "EU",
  "Mongolia": "APAC",
  "Mauritius": "SSA",
  "Malawi": "SSA",
  "Malaysia": "APAC",
  "Namibia": "SSA",
  "Nigeria": "SSA",
  "Nicaragua": "LATAM",
  "Netherlands": "EU",
  "New Zealand": "APAC",
  "Oman": "MENA",
  "Pakistan": "APAC",
  "Panama": "LATAM",
  "Peru": "LATAM",
  "Philippines": "APAC",
  "Poland": "EU",
  "Portugal": "EU",
  "Paraguay": "LATAM",
  "Qatar": "MENA",
  "Romania": "EU",
  "Rwanda": "SSA",
  "Saudi Arabia": "MENA",
  "Senegal": "SSA",
  "Singapore": "APAC",
  "Sierra Leone": "SSA",
  "Sri Lanka": "APAC",
  "Nepal": "APAC",
  "El Salvador": "LATAM",
  "Serbia": "EU",
  "Slovak Republic": "EU",
  "Slovenia": "EU",
  "Sweden": "EU",
  "Thailand": "APAC",
  "Tajikistan": "APAC",
  "Trinidad and Tobago": "LATAM",
  "Tunisia": "MENA",
  "Turkiye": "MENA",
  "Tanzania": "SSA",
  "Uruguay": "LATAM",
  "United States": "NA",
  "Uzbekistan": "APAC",
  "Venezuela, RB": "LATAM",
  "Viet Nam": "APAC",
  "South Africa": "SSA",
  "Zambia": "SSA",
  "Zimbabwe": "SSA"
};

var COUNTRY_TO_INCOME_CLASS = {
  // Europe / High
  "Denmark": "HIGH",
  "Germany": "HIGH",
  "United Kingdom": "HIGH",
  "Switzerland": "HIGH",
  "Netherlands": "HIGH",
  "Sweden": "HIGH",
  "Ireland": "HIGH",
  "Iceland": "HIGH",
  "Luxembourg": "HIGH",
  "Malta": "HIGH",
  "Cyprus": "HIGH",

  // North America / High
  "United States": "HIGH",
  "Canada": "HIGH",

  // MENA
  "United Arab Emirates": "HIGH",
  "Qatar": "HIGH",
  "Saudi Arabia": "HIGH",
  "Kuwait": "HIGH",
  "Oman": "HIGH",
  "Bahrain": "HIGH",
  "Israel": "HIGH",
  "Turkey": "UPPER_MID",    // "Turkiye" ile eşleştir, aşağıda var
  "Turkiye": "UPPER_MID",
  "Iran, Islamic Rep.": "UPPER_MID",
  "Jordan": "UPPER_MID",
  "Lebanon": "UPPER_MID",
  "Morocco": "LOWER_MID",
  "Tunisia": "LOWER_MID",
  "Algeria": "UPPER_MID",
  "Egypt, Arab Rep.": "LOWER_MID",

  // APAC
  "Japan": "HIGH",
  "Korea, Rep.": "HIGH",
  "Singapore": "HIGH",
  "Australia": "HIGH",
  "New Zealand": "HIGH",
  "China": "UPPER_MID",
  "Malaysia": "UPPER_MID",
  "Thailand": "UPPER_MID",
  "Indonesia": "LOWER_MID",
  "Philippines": "LOWER_MID",
  "Viet Nam": "LOWER_MID",
  "India": "LOWER_MID",
  "Pakistan": "LOWER_MID",
  "Bangladesh": "LOWER_MID",
  "Kazakhstan": "UPPER_MID",
  "Uzbekistan": "LOWER_MID",
  "Mongolia": "LOWER_MID",
  "Cambodia": "LOWER_MID",
  "Lao PDR": "LOWER_MID",
  "Tajikistan": "LOWER_MID",
  "Kyrgyz Republic": "LOWER_MID",
  "Sri Lanka": "LOWER_MID",
  "Nepal": "LOWER_MID",

  // LATAM
  "Chile": "HIGH",
  "Uruguay": "HIGH",
  "Argentina": "UPPER_MID",
  "Brazil": "UPPER_MID",
  "Colombia": "UPPER_MID",
  "Peru": "UPPER_MID",
  "Mexico": "UPPER_MID",
  "Costa Rica": "HIGH",
  "Panama": "HIGH",
  "Paraguay": "UPPER_MID",
  "El Salvador": "LOWER_MID",
  "Guatemala": "LOWER_MID",
  "Honduras": "LOWER_MID",
  "Nicaragua": "LOWER_MID",
  "Dominican Republic": "UPPER_MID",
  "Jamaica": "UPPER_MID",
  "Trinidad and Tobago": "HIGH",
  "Venezuela, RB": "LOWER_MID", // üzgün gerçeklik

  // SSA
  "South Africa": "UPPER_MID",
  "Botswana": "UPPER_MID",
  "Namibia": "UPPER_MID",
  "Mauritius": "HIGH",
  "Ghana": "LOWER_MID",
  "Kenya": "LOWER_MID",
  "Nigeria": "LOWER_MID",
  "Rwanda": "LOW",
  "Tanzania": "LOWER_MID",
  "Zambia": "LOWER_MID",
  "Zimbabwe": "LOW",
  "Malawi": "LOW",
  "Senegal": "LOWER_MID",
  "Cote d'Ivoire": "LOWER_MID",
  "Sierra Leone": "LOW",

  // CEE / Others
  "Poland": "HIGH",
  "Czechia": "HIGH",
  "Hungary": "HIGH",
  "Slovak Republic": "HIGH",
  "Slovenia": "HIGH",
  "Romania": "UPPER_MID",
  "Bulgaria": "UPPER_MID",
  "Serbia": "UPPER_MID",
  "Bosnia and Herzegovina": "UPPER_MID",
  "North Macedonia": "UPPER_MID",
  "Moldova": "LOWER_MID",
  "Georgia": "UPPER_MID",
  "Armenia": "UPPER_MID",
  "Azerbaijan": "UPPER_MID",
  "Albania": "UPPER_MID",
  "Lithuania": "HIGH",
  "Latvia": "HIGH",
  "Estonia": "HIGH",
  "Austria": "HIGH",
  "Italy": "HIGH",
  "Spain": "HIGH",
  "Portugal": "HIGH",
  "Greece": "HIGH",
  "Belgium": "HIGH",
  "France": "HIGH",
  "Switzerland": "HIGH",
  "Iceland": "HIGH",
  "Luxembourg": "HIGH",
  "Croatia": "HIGH",
  "Montenegro": "UPPER_MID",
  "Malta": "HIGH"
};

var EPSILON = 0.001;

function get_income_class(country) {
  return COUNTRY_TO_INCOME_CLASS[country] || "UPPER_MID";
}

function safeValue(v) {
  if (v === 0 || isNaN(v) || v == null) return 0.001;
  return v;
}

function hasMissingOrZero(val) {
  return val == null || Number.isNaN(val) || Number(val) === 0;
}

function compose_data_note({ V, count, rawVal, region, incomeClass }) {

  if (hasMissingOrZero(rawVal)) return `MISSING_OR_ZERO_SOURCE_VALUES (epsilon=${EPSILON})`;
  if ((count || 0) < 2) return "INSUFFICIENT_SERIES_LENGTH (<=1 point)";
  if (Number(V) === 0) return "LOW_VOLATILITY_OR_FLAT_SERIES (V=0)";
  if (!region || !incomeClass) return "MISSING_METADATA (Region/IncomeClass)";
  return null;
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function ema(v, sPrev, alpha) {
  if (sPrev === null) return v;
  return alpha * v + (1 - alpha) * sPrev;
}

function pick_factor(country) {
  if (COUNTRY_OVERRIDES[country]) return COUNTRY_OVERRIDES[country];

  var region = COUNTRY_TO_REGION[country];
  if (region && REGION_DEFAULTS[region]) return REGION_DEFAULTS[region];

  return 1.00;
}

function pick_alpha(country, prevGas, currGas, V, count) {
  
  var a = 0.50;

  var region = COUNTRY_TO_REGION[country];
  var incomeClass = get_income_class(country);

  if (region === 'APAC' || region === 'SSA' || region === 'LATAM') a += 0.03;
  if (region === 'EU' || region === 'NA') a -= 0.02;

  if (incomeClass === 'HIGH') a -= 0.02;
  else if (incomeClass === 'LOWER_MID') a += 0.01;
  else if (incomeClass === 'LOW') a += 0.02;

  // 3) Şok ve lineer ölçek
  if (prevGas == null || currGas == null) return { alpha: clamp(a, 0.30, 0.85), stepDelta: 0, baseV: V || 0 };

  var stepDelta = Math.abs(currGas - prevGas);
  var baseV = V || 0;
  var threshold = Math.max(0.05, 1.5 * baseV);

  if (stepDelta > threshold) {
    a += 0.25; // şok modu
  } else {
    // lineer harita
    var low = 0;
    var high = Math.max(baseV, 1e-6);
    var t = clamp((stepDelta - low) / (high - low), 0, 1); // 0..1
    a += (-0.15) + t * (0.30); // [-0.15 .. +0.15]
  }

  // 4) Veri azlığı cezası
  if ((count || 0) < 4) a -= 0.05;

  return { alpha:  clamp(a, 0.30, 0.85), stepDelta, baseV };
} 

function basic_volatility(country_gasoline_prices) { 

  if (country_gasoline_prices.length < 2) return { median: 0, count: (country_gasoline_prices ? country_gasoline_prices.length : 0) };

  var diffs = [];
  for (let i=1;i<country_gasoline_prices.length;i++) diffs.push(Math.abs(country_gasoline_prices[i]-country_gasoline_prices[i-1]));
  diffs.sort((a,b)=>a-b);

  var mid = Math.floor(diffs.length/2);
  var median = diffs.length % 2 ? diffs[mid] : (diffs[mid-1]+diffs[mid])/2;
  return { median, count: country_gasoline_prices.length };
}

function estimate_diesel_for_country(group_by_country_fuel_prices_list) {

  for(var i = 0; i < group_by_country_fuel_prices_list.length; i++){
    
    var row = group_by_country_fuel_prices_list[i];
    var country_name = row["country_name"];

    var sPrev = null;
    var prev_gas = null;

    row.gasoline_prices.sort((a, b) => {
      var ya = Number(Object.keys(a)[0]);
      var yb = Number(Object.keys(b)[0]);
      return ya - yb;
    });

    var { median, count } = basic_volatility(row.gasoline_prices.map(function(item){ return Number(item[Object.keys(item)[0]]["Value"]) } ));

    for(var gas_row_i = 0; gas_row_i < row.gasoline_prices.length; gas_row_i++){

      var year = Object.keys(row["gasoline_prices"][gas_row_i])[0];
      var gas_row = row["gasoline_prices"][gas_row_i][year];

      var real_gas = Number(gas_row["Value"]);
      var gas = safeValue(Number(gas_row["Value"]));

      if (prev_gas == null) prev_gas = gas;

      var norm_country = (country_name === "Turkey" ? "Turkiye" : country_name);

      var region = COUNTRY_TO_REGION[norm_country] || null; 
      var income_class = get_income_class(norm_country);

      var { alpha, stepDelta, baseV } = pick_alpha(norm_country, prev_gas, gas, median, count);

      var smoothed = ema(gas, sPrev, alpha);
      var factor = clamp(pick_factor(norm_country), 0.90, 1.15);
      var dieselValue = safeValue(Number((smoothed * factor).toFixed(3)));

      var volatility_score = 1 - clamp(baseV * 5, 0, 0.4); // daha az oynak = daha yüksek güven
      var data_bonus = clamp((count - 2) * 0.05, 0, 0.15); // fazla yıl verisi bonus
      var shock_penalty = stepDelta > 1.5 * baseV ? 0.1 : 0; // şok varsa ceza
      var alpha_penalty = alpha > 0.75 ? 0.05 : 0; // aşırı agresif EMA ise ceza

      var confidence = clamp(0.6 + volatility_score + data_bonus - shock_penalty - alpha_penalty, 0.4, 0.95);

      var data_note = compose_data_note({
        V: median,
        count,
        rawVal: real_gas,
        region,
        incomeClass: income_class 
      });

      var new_diesel_price = {
        Name: gas_row["Name"],
        Year: year,
        Period: gas_row["Period"],
        Units: gas_row["Units"],
        Grade: 'diesel',
        EnergyType: 'DIESEL',
        Value: dieselValue,
        Method: 'FACTOR_EMA',
        Source: sPrev === null ? null : `ESTIMATED_FROM_GASOLINE(EMA=${smoothed}, alpha=${alpha}, factor=${factor})`,
        FactorUsed: factor,
        Confidence: confidence,
        EMA: smoothed,
        PrevEMA: (sPrev === null ? null : sPrev),
        AlphaUsed: (sPrev === null ? null : alpha),
        PrevGas: prev_gas,  
        StepDelta: stepDelta,
        VolBaseline: baseV,
        Region: region,
        IncomeClass: income_class,
        DataNote: data_note
      };

      if( 'diesel_prices' in row ) row.diesel_prices.push({ [year]: new_diesel_price });
      else Object.assign(row, { diesel_prices: [{ [year]: new_diesel_price }] });

      sPrev = smoothed;
      prev_gas = gas;
    };
  };

  return group_by_country_fuel_prices_list;
}

module.exports = estimate_diesel_for_country;