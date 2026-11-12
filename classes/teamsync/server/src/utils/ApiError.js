// An Error that carries an HTTP status code.  Usage: throw new ApiError(404, "Not found")
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = ApiError;
