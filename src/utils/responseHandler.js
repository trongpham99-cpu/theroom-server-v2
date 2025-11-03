/**
 * Standard API Response Wrapper
 * Following JSend specification: https://github.com/omniti-labs/jsend
 *
 * Response format:
 * {
 *   status: 'success' | 'fail' | 'error',
 *   message: string,
 *   data: any,
 *   meta: object (optional - for pagination, timestamps, etc.)
 * }
 */

/**
 * Success response
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Response}
 */
const success = (res, statusCode = 200, data = null, message = 'Success', meta = null) => {
  const response = {
    status: 'success',
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 * @param {Response} res - Express response object
 * @param {any} data - Created resource data
 * @param {string} message - Success message
 * @returns {Response}
 */
const created = (res, data = null, message = 'Resource created successfully') => {
  return success(res, 201, data, message);
};

/**
 * No content response (204)
 * @param {Response} res - Express response object
 * @returns {Response}
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Fail response (for client errors 4xx)
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors or detailed error info
 * @returns {Response}
 */
const fail = (res, statusCode = 400, message = 'Request failed', errors = null) => {
  const response = {
    status: 'fail',
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response (for server errors 5xx)
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} stack - Error stack trace (only in development)
 * @returns {Response}
 */
const error = (res, statusCode = 500, message = 'Internal server error', stack = null) => {
  const response = {
    status: 'error',
    message,
  };

  if (stack) {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {Response} res - Express response object
 * @param {any} data - Response data
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 * @returns {Response}
 */
const paginated = (res, data, pagination, message = 'Success') => {
  return success(res, 200, data, message, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      totalResults: pagination.totalResults,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
  });
};

/**
 * Custom response with full control
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} payload - Custom response payload
 * @returns {Response}
 */
const custom = (res, statusCode, payload) => {
  return res.status(statusCode).json(payload);
};

module.exports = {
  success,
  created,
  noContent,
  fail,
  error,
  paginated,
  custom,
};
