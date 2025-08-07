exports.sqlDateFormat = function (date) {
  return date.toISOString().split("T")[0];
};

exports.sqlDateTimeFormat = function (date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
};
