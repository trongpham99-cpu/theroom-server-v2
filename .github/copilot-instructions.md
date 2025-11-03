# Copilot Instructions for THEROOM Server v2

## Architecture Overview

This is a Node.js Express RESTful API using MongoDB/Mongoose, based on the node-express-boilerplate architecture. The app follows a layered architecture pattern:

**Request Flow**: Route → Middleware (auth/validate) → Controller → Service → Model → Database

- **Routes** (`src/routes/v1/`): Define endpoints and apply middlewares. All API routes are prefixed with `/api/v1/`
- **Controllers** (`src/controllers/`): Handle HTTP requests/responses, wrapped in `catchAsync` utility
- **Services** (`src/services/`): Business logic layer - controllers should NEVER directly interact with models
- **Models** (`src/models/`): Mongoose schemas with custom plugins (`toJSON`, `paginate`)
- **Middlewares** (`src/middlewares/`): `auth`, `validate`, `error`, `rateLimiter`

## Critical Patterns & Conventions

### Error Handling
All controllers MUST use `catchAsync` wrapper to forward errors to centralized error handler:
```javascript
const controller = catchAsync(async (req, res) => {
  // Throw ApiError with status code and message
  throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
});
```

Never use try-catch in controllers - let `catchAsync` handle it. The error middleware converts all errors to `ApiError` format.

### Authentication & Authorization
- **Authentication**: Use `auth()` middleware to require valid JWT token
- **Authorization**: Pass required rights as arguments: `auth('manageUsers', 'getUsers')`
- Rights are role-based (see `src/config/roles.js`): `admin` has `['getUsers', 'manageUsers']`, `user` has `[]`
- Users can access their own resources even without rights (checked via `req.params.userId !== user.id`)

### Request Validation
Always validate requests using Joi schemas in `src/validations/`:
```javascript
router.post('/users', validate(userValidation.createUser), userController.createUser);
```

The `validate` middleware checks `params`, `query`, and `body` against the schema.

### Mongoose Plugins
Models use two custom plugins:
- **`toJSON`**: Removes `__v`, `createdAt`, `updatedAt`, fields with `private: true`, replaces `_id` with `id`
- **`paginate`**: Adds static method for pagination with `sortBy`, `limit`, `page`, `populate` options

Example: `User.paginate({ role: 'user' }, { sortBy: 'name:desc', limit: 10, page: 1 })`

### API Response Structure
ALL API responses MUST use the standardized response handler (`src/utils/responseHandler.js`) following JSend specification:

**Success Response (2xx):**
```javascript
responseHandler.success(res, statusCode, data, message, meta);
// Returns:
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... } // optional
}
```

**Fail Response (4xx - client errors):**
```javascript
responseHandler.fail(res, statusCode, message, errors);
// Returns:
{
  "status": "fail",
  "message": "Request failed",
  "errors": { ... } // optional
}
```

**Error Response (5xx - server errors):**
```javascript
responseHandler.error(res, statusCode, message, stack);
// Returns:
{
  "status": "error",
  "message": "Internal server error",
  "stack": "..." // only in development
}
```

**Pagination Response:**
```javascript
responseHandler.paginated(res, data, pagination, message);
// Returns:
{
  "status": "success",
  "message": "Success",
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalResults": 48,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Helper methods:**
- `responseHandler.created(res, data, message)` - 201 responses
- `responseHandler.noContent(res)` - 204 responses
- `responseHandler.custom(res, statusCode, payload)` - Custom responses

### Service Layer Pattern
Controllers should ONLY:
1. Extract data from `req` using `pick` utility
2. Call service methods
3. Use `responseHandler` to send standardized responses

ALL business logic belongs in services. Services handle model interactions and throw `ApiError` for failures.

## Developer Workflows

### Development
```bash
yarn dev              # Start with nodemon hot-reload
yarn test             # Run all Jest tests (integration + unit)
yarn test:watch       # Watch mode for TDD
yarn coverage         # Generate coverage report
yarn lint:fix         # Auto-fix ESLint errors
yarn prettier:fix     # Auto-fix Prettier formatting
```

### Production
```bash
yarn start            # Start with PM2 (uses ecosystem.config.json)
yarn docker:prod      # Run production Docker setup
```

### Environment Setup
Copy `.env.example` to `.env` and configure:
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET`, `JWT_ACCESS_EXPIRATION_MINUTES`, `JWT_REFRESH_EXPIRATION_DAYS`
- SMTP settings for email service

### Testing
- Use `setupTestDB()` from `tests/utils/setupTestDB.js` to auto-clear collections between tests
- Integration tests are in `tests/integration/` and use `supertest` for HTTP requests
- Unit tests mock dependencies with `jest.mock()` or `node-mocks-http`
- Tests run with `NODE_ENV=test` (configured in `jest.config.js`)

## API Documentation
Swagger docs are auto-generated from JSDoc comments in route files. View at `/api/v1/docs` in development mode.

Pattern:
```javascript
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
```

## Key Implementation Details

### Token Management
- Access tokens (JWT): 30 min expiry, stored in client
- Refresh tokens: 30 days expiry, stored in DB (`token.model.js`) and can be blacklisted
- Token types: `REFRESH`, `RESET_PASSWORD`, `VERIFY_EMAIL` (see `src/config/tokens.js`)

### Password Security
- Hashed with bcrypt (pre-save hook in `user.model.js`)
- Must contain at least one letter and one number, min 8 characters
- Instance method `user.isPasswordMatch(password)` for verification

### Logging
- Winston logger (`src/config/logger.js`) with levels: error/warn/info/http/debug
- Morgan for HTTP request logging (custom tokens in `src/config/morgan.js`)
- In production, only info/warn/error logs; dev mode logs everything
- PM2 captures console logs to files in production

### Rate Limiting
Auth endpoints (`/api/v1/auth`) are rate-limited in production only (see `src/middlewares/rateLimiter.js`).

### Custom User Fields
The User model includes non-standard fields for frontend integration:
- `photoURL`: Avatar path
- `settings`: Frontend layout/theme preferences (nested object)
- `shortcuts`: Array of shortcut IDs

When adding auth features, the login response includes these fields formatted for frontend consumption.
