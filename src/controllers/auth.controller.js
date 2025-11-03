const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);

  const userData = {
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      photoURL: user.photoURL,
    },
    tokens,
  };

  responseHandler.created(res, userData, 'User registered successfully');
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  const userData = {
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      photoURL: user.photoURL,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      settings: user.settings,
      shortcuts: user.shortcuts,
      loginRedirectUrl: (user.settings && user.settings.loginRedirectUrl) || '/',
    },
    tokens,
  };

  responseHandler.success(res, httpStatus.OK, userData, 'Login successful');
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  responseHandler.success(res, httpStatus.OK, null, 'Logout successful');
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  responseHandler.success(res, httpStatus.OK, { tokens }, 'Tokens refreshed successfully');
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  responseHandler.success(res, httpStatus.OK, null, 'Reset password email sent successfully');
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  responseHandler.success(res, httpStatus.OK, null, 'Password reset successfully');
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  responseHandler.success(res, httpStatus.OK, null, 'Verification email sent successfully');
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  responseHandler.success(res, httpStatus.OK, null, 'Email verified successfully');
});

const getCurrentUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);

  const userData = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    isEmailVerified: user.isEmailVerified,
    settings: user.settings,
    shortcuts: user.shortcuts,
  };

  responseHandler.success(res, httpStatus.OK, userData, 'User profile retrieved successfully');
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  getCurrentUser,
};
