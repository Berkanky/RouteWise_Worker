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

module.exports = best_country_match;