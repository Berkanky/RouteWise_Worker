function diff_countries_snapshots(old_list, new_list) {

  var result = {
    country_added: [],
    country_removed: [],
    country_changed: []
  }

  var old_map = new Map(old_list.map(c => [c.Name, c]))
  var new_map = new Map(new_list.map(c => [c.Name, c]))

  for (const [name, new_country] of new_map.entries()) {
    if (!old_map.has(name)) result.country_added.push(new_country)
  }

  for (const [name, old_country] of old_map.entries()) {
    if (!new_map.has(name)) result.country_removed.push(old_country)
  }

  for (const [name, old_country] of old_map.entries()) {
    var new_country = new_map.get(name)
    if (!new_country) continue

    var fuel_diff = diff_fuel_rows(old_country, new_country)

    if (
      fuel_diff.added.length > 0 ||
      fuel_diff.removed.length > 0 ||
      fuel_diff.changed.length > 0
    ) {
      result.country_changed.push({
        Name: name,
        added: fuel_diff.added,
        removed: fuel_diff.removed,
        changed: fuel_diff.changed
      })
    }
  }
  return result.country_changed;
};

function build_fuel_map(country) {
  var map = new Map()
  ;(country.FuelPrices || []).forEach(row => {
    var key = `${country.Name}-${row.Year}-${row.EnergyType}-${row.Grade}`
    map.set(key, row)
  })
  return map
};

function diff_row(old_row, new_row) {
  var ignore = new Set(["_id", "CreatedDate", "UpdatedDate"])
  var diff = {}

  var keys = new Set([...Object.keys(old_row), ...Object.keys(new_row)])

  keys.forEach(k => {
    if (ignore.has(k)) return
    if (old_row[k] !== new_row[k]) {
      diff[k] = { old: old_row[k], new: new_row[k] }
    }
  })

  return diff
};

function diff_fuel_rows(old_country, new_country) {
  var old_map = build_fuel_map(old_country)
  var new_map = build_fuel_map(new_country)

  var added = []
  var removed = []
  var changed = []

  for (const [key, new_row] of new_map.entries()) {
    var old_row = old_map.get(key)

    if (!old_row) {
      added.push({ key, row: new_row })
      continue
    }

    var diffs = diff_row(old_row, new_row)
    if (Object.keys(diffs).length > 0) {
      changed.push({ key, old: old_row, new: new_row, diff: diffs })
    }
  }

  for (const [key, old_row] of old_map.entries()) {
    if (!new_map.has(key)) removed.push({ key, row: old_row })
  }

  return { added, removed, changed }
};

module.exports = { diff_countries_snapshots };