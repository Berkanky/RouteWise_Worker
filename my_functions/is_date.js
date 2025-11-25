function is_date(value) {
  if (!value) return false;

  var s = String(value).trim();

  if (!s) return false;

  var datePattern = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/;

  return datePattern.test(s);
};

module.exports = is_date;