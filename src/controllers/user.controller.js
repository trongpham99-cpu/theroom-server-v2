const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  responseHandler.created(res, user, 'User created successfully');
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);

  // Extract pagination info
  const { results, page, limit, totalPages, totalResults } = result;

  responseHandler.paginated(res, results, { page, limit, totalPages, totalResults }, 'Users retrieved successfully');
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  responseHandler.success(res, httpStatus.OK, user, 'User retrieved successfully');
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  responseHandler.success(res, httpStatus.OK, user, 'User updated successfully');
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  responseHandler.success(res, httpStatus.OK, null, 'User deleted successfully');
});

const updateOwnSettings = catchAsync(async (req, res) => {
  const allowedFields = pick(req.body, ['settings', 'shortcuts', 'photoURL']);
  const user = await userService.updateUserById(req.user.id, allowedFields);
  responseHandler.success(res, httpStatus.OK, user, 'Settings updated successfully');
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateOwnSettings,
};
