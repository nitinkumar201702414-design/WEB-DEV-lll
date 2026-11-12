const ApiError = require("./ApiError");

const OBJECT_ID = /^[a-f\d]{24}$/i;

exports.isObjectId = (id) => OBJECT_ID.test(String(id));

exports.assertObjectId = (id, label = "id") => {
  if (!exports.isObjectId(id)) throw new ApiError(400, `Invalid ${label}`);
};

exports.requireFields = (body, fields) => {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || String(body[f]).trim() === ""
  );
  if (missing.length) throw new ApiError(400, `Missing required field(s): ${missing.join(", ")}`);
};

exports.parseDate = (value, label = "date") => {
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return d;
};

// Escape user text before using it inside a regular expression.
exports.escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Reads ?page=&limit= safely.
exports.getPagination = (query, maxLimit = 50, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

exports.paginationMeta = (page, limit, total) => ({
  page, limit, total, pages: Math.ceil(total / limit) || 1,
});
