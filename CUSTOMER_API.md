# Customer API Integration Guide

## 📌 Overview

API để quản lý khách hàng (Customers) trong hệ thống The Room Manager.

**Base URL:** `http://localhost:3321/api/v1`

**Note:** ⚠️ Hiện tại chỉ có endpoint để **tạo customer**. Các endpoints khác (GET, UPDATE, DELETE) sẽ được bổ sung sau.

---

## 📋 Table of Contents

- [Customer Model Schema](#-customer-model-schema)
- [Create Customer](#-create-customer)
- [React Integration Examples](#-react-integration-examples)
- [Use Cases & Best Practices](#-use-cases--best-practices)
- [Planned Features](#-planned-features)

---

# 📊 Customer Model Schema

## Data Structure

```typescript
interface Customer {
  _id: string;              // MongoDB ObjectId
  uuid: string;             // Unique identifier (có thể là Zalo UUID)
  name: string;             // Tên khách hàng (required)
  phone: string;            // Số điện thoại
  dob: Date;                // Ngày sinh
  room_id: string;          // Room ID (ObjectId, required)
  apartment_id: string;     // Apartment ID (ObjectId, required)
  createdAt: Date;          // Thời gian tạo
  updatedAt: Date;          // Thời gian cập nhật
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | String | ✅ Yes | Unique identifier (thường là Zalo user UUID) |
| `name` | String | ✅ Yes | Tên đầy đủ của khách hàng |
| `phone` | String | ⚪ Optional | Số điện thoại (format: "0901234567") |
| `dob` | Date/String | ⚪ Optional | Ngày sinh (ISO format: "1990-05-15") |
| `room_id` | String | ✅ Yes | ID của phòng (MongoDB ObjectId) |
| `apartment_id` | String | ✅ Yes | ID của tòa nhà (MongoDB ObjectId) |

---

# 🆕 Create Customer

## POST /api/v1/rooms/register

Đăng ký khách hàng vào phòng (tạo customer record mới).

**Note:** Endpoint này nằm trong `/rooms/register` vì nó liên quan đến việc đăng ký phòng cho khách hàng.

### Request

```http
POST /api/v1/rooms/register HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Headers:** Không cần authentication

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | String | ✅ Yes | Unique identifier (Zalo UUID hoặc unique string) |
| `name` | String | ✅ Yes | Tên khách hàng |
| `phone` | String | ✅ Yes | Số điện thoại |
| `dob` | String | ✅ Yes | Ngày sinh (ISO format: YYYY-MM-DD) |
| `room_id` | String | ✅ Yes | Room ID (MongoDB ObjectId) |
| `apartment_id` | String | ✅ Yes | Apartment ID (MongoDB ObjectId) |

---

### Request Body Example

```json
{
  "uuid": "zalo_user_12345",
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "dob": "1990-05-15",
  "room_id": "673room001...",
  "apartment_id": "673abc123def456..."
}
```

---

### Response Success (200 OK)

⚠️ **Note:** Hiện tại endpoint này **không return response body** khi thành công (bug). Chỉ check HTTP status code 200.

**Current behavior:** HTTP 200 với empty body

**Expected behavior (sẽ fix sau):**
```json
{
  "status": "success",
  "message": "Customer registered successfully",
  "data": {
    "_id": "673customer001...",
    "uuid": "zalo_user_12345",
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "dob": "1990-05-15T00:00:00.000Z",
    "room_id": "673room001...",
    "apartment_id": "673abc123def456...",
    "createdAt": "2025-11-14T10:00:00.000Z",
    "updatedAt": "2025-11-14T10:00:00.000Z"
  }
}
```

---

### Error Responses

#### 400 Bad Request - Missing Required Fields
```json
{
  "status": "error",
  "message": "Missing required fields"
}
```

#### 400 Bad Request - UUID Already Exists
```json
{
  "status": "error",
  "message": "Customer with this UUID already exists"
}
```

#### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "An error occurred while processing your request.",
  "error": "Error details..."
}
```

---

### Example Usage (JavaScript/Fetch)

```javascript
const registerCustomer = async (customerData) => {
  try {
    const response = await fetch('http://localhost:3321/api/v1/rooms/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    // Note: Response body is empty, check status code only
    if (response.status === 200) {
      return { success: true };
    }
  } catch (error) {
    console.error('Error registering customer:', error);
    throw error;
  }
};

// Usage
await registerCustomer({
  uuid: 'zalo_user_12345',
  name: 'Nguyễn Văn A',
  phone: '0901234567',
  dob: '1990-05-15',
  room_id: '673room001...',
  apartment_id: '673abc123def456...'
});
```

---

### Example Usage (Axios)

```javascript
import axios from 'axios';

const registerCustomer = async (customerData) => {
  try {
    const response = await axios.post(
      'http://localhost:3321/api/v1/rooms/register',
      customerData
    );
    
    // Note: Response body is empty, but status 200 means success
    return { success: true };
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};
```

---

### Example Usage (React Hook)

```javascript
import { useState } from 'react';
import axios from 'axios';

const useRegisterCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const registerCustomer = async (customerData) => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        'http://localhost:3321/api/v1/rooms/register',
        customerData
      );
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { registerCustomer, loading, error };
};

// Usage in component
function CustomerRegistrationForm() {
  const { registerCustomer, loading, error } = useRegisterCustomer();
  const [formData, setFormData] = useState({
    uuid: '',
    name: '',
    phone: '',
    dob: '',
    room_id: '',
    apartment_id: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await registerCustomer(formData);
      alert('Đăng ký thành công!');
      // Reset form
      setFormData({
        uuid: '',
        name: '',
        phone: '',
        dob: '',
        room_id: '',
        apartment_id: ''
      });
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Đăng ký khách hàng</h2>
      
      <input
        type="text"
        placeholder="UUID (Zalo user ID)"
        value={formData.uuid}
        onChange={(e) => setFormData({...formData, uuid: e.target.value})}
        required
      />

      <input
        type="text"
        placeholder="Họ tên"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />

      <input
        type="tel"
        placeholder="Số điện thoại"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
      />

      <input
        type="date"
        value={formData.dob}
        onChange={(e) => setFormData({...formData, dob: e.target.value})}
        required
      />

      <ApartmentSelect
        value={formData.apartment_id}
        onChange={(val) => setFormData({
          ...formData,
          apartment_id: val,
          room_id: '' // Reset room when apartment changes
        })}
      />

      <RoomSelect
        apartmentId={formData.apartment_id}
        value={formData.room_id}
        onChange={(val) => setFormData({...formData, room_id: val})}
      />

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Đăng ký'}
      </button>
    </form>
  );
}
```

---

# 🔧 Complete Integration Example

## Service Layer

```javascript
// services/customerService.js
import axios from 'axios';

const API_BASE = 'http://localhost:3321/api/v1';

export const customerService = {
  // Register customer (create)
  register: async (customerData) => {
    const response = await axios.post(
      `${API_BASE}/rooms/register`,
      customerData
    );
    // Note: Response body is empty, status 200 = success
    return { success: true };
  },

  // TODO: Will be added later
  // getAll: async () => { ... },
  // getById: async (id) => { ... },
  // update: async (id, data) => { ... },
  // delete: async (id) => { ... },
};
```

---

## React Context

```javascript
// contexts/CustomerContext.js
import { createContext, useContext, useState } from 'react';
import { customerService } from '../services';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const registerCustomer = async (customerData) => {
    setLoading(true);
    setError(null);

    try {
      await customerService.register(customerData);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        registerCustomer,
        loading,
        error,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
};
```

---

## Complete Registration Form Component

```javascript
import { useState } from 'react';
import { useCustomer } from '../contexts/CustomerContext';
import { useApartments, useRooms } from '../hooks';

function CustomerRegistrationForm() {
  const { registerCustomer, loading, error } = useCustomer();
  const { apartments } = useApartments();
  const { rooms, getRoomsByApartment } = useRooms();

  const [formData, setFormData] = useState({
    uuid: `user_${Date.now()}`, // Auto-generate UUID
    name: '',
    phone: '',
    dob: '',
    apartment_id: '',
    room_id: ''
  });

  const [errors, setErrors] = useState({});

  // Get rooms for selected apartment
  const availableRooms = formData.apartment_id
    ? getRoomsByApartment(formData.apartment_id)
    : [];

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.dob) {
      newErrors.dob = 'Vui lòng chọn ngày sinh';
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      if (dob > today) {
        newErrors.dob = 'Ngày sinh không thể trong tương lai';
      }
    }

    if (!formData.apartment_id) {
      newErrors.apartment_id = 'Vui lòng chọn tòa nhà';
    }

    if (!formData.room_id) {
      newErrors.room_id = 'Vui lòng chọn phòng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await registerCustomer(formData);
      alert('Đăng ký khách hàng thành công!');
      
      // Reset form
      setFormData({
        uuid: `user_${Date.now()}`,
        name: '',
        phone: '',
        dob: '',
        apartment_id: '',
        room_id: ''
      });
      setErrors({});
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleApartmentChange = (apartmentId) => {
    setFormData({
      ...formData,
      apartment_id: apartmentId,
      room_id: '' // Reset room
    });
  };

  return (
    <div className="customer-registration">
      <h2>Đăng ký khách hàng mới</h2>

      <form onSubmit={handleSubmit}>
        {/* UUID (Auto-generated, hidden) */}
        <input type="hidden" value={formData.uuid} />

        {/* Name */}
        <div className="form-group">
          <label>Họ tên *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Nguyễn Văn A"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label>Số điện thoại *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="0901234567"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        {/* Date of Birth */}
        <div className="form-group">
          <label>Ngày sinh *</label>
          <input
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({...formData, dob: e.target.value})}
            max={new Date().toISOString().split('T')[0]}
            className={errors.dob ? 'error' : ''}
          />
          {errors.dob && <span className="error-text">{errors.dob}</span>}
        </div>

        {/* Apartment */}
        <div className="form-group">
          <label>Tòa nhà *</label>
          <select
            value={formData.apartment_id}
            onChange={(e) => handleApartmentChange(e.target.value)}
            className={errors.apartment_id ? 'error' : ''}
          >
            <option value="">-- Chọn tòa nhà --</option>
            {apartments.map(apt => (
              <option key={apt._id} value={apt._id}>
                {apt.code}
              </option>
            ))}
          </select>
          {errors.apartment_id && (
            <span className="error-text">{errors.apartment_id}</span>
          )}
        </div>

        {/* Room */}
        <div className="form-group">
          <label>Phòng *</label>
          <select
            value={formData.room_id}
            onChange={(e) => setFormData({...formData, room_id: e.target.value})}
            disabled={!formData.apartment_id}
            className={errors.room_id ? 'error' : ''}
          >
            <option value="">
              {formData.apartment_id ? '-- Chọn phòng --' : '-- Chọn tòa nhà trước --'}
            </option>
            {availableRooms.map(room => (
              <option key={room._id} value={room._id}>
                {room.code}
              </option>
            ))}
          </select>
          {errors.room_id && (
            <span className="error-text">{errors.room_id}</span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký khách hàng'}
        </button>
      </form>
    </div>
  );
}

export default CustomerRegistrationForm;
```

---

# 🎯 Use Cases & Scenarios

## Use Case 1: Zalo Integration - Register from Zalo Chat

```javascript
const registerFromZalo = async (zaloUser, roomId, apartmentId) => {
  try {
    const customerData = {
      uuid: zaloUser.id, // Zalo user ID
      name: zaloUser.name || 'Khách hàng',
      phone: zaloUser.phone || '',
      dob: zaloUser.dob || '1990-01-01',
      room_id: roomId,
      apartment_id: apartmentId
    };

    await customerService.register(customerData);
    console.log('Customer registered from Zalo');
  } catch (error) {
    console.error('Failed to register from Zalo:', error);
  }
};
```

---

## Use Case 2: Bulk Registration

```javascript
const bulkRegisterCustomers = async (customers) => {
  const results = {
    success: [],
    failed: []
  };

  for (const customer of customers) {
    try {
      await customerService.register(customer);
      results.success.push(customer);
    } catch (error) {
      results.failed.push({
        customer,
        error: error.message
      });
    }
  }

  return results;
};

// Usage
const customers = [
  {
    uuid: 'user_1',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    dob: '1990-05-15',
    room_id: 'room1_id',
    apartment_id: 'apt1_id'
  },
  {
    uuid: 'user_2',
    name: 'Trần Thị B',
    phone: '0907654321',
    dob: '1992-08-20',
    room_id: 'room2_id',
    apartment_id: 'apt1_id'
  }
];

const results = await bulkRegisterCustomers(customers);
console.log(`Success: ${results.success.length}, Failed: ${results.failed.length}`);
```

---

## Use Case 3: Registration with Validation

```javascript
const validateAndRegister = async (customerData) => {
  // Client-side validation
  const errors = {};

  if (!customerData.name?.trim()) {
    errors.name = 'Tên không được để trống';
  }

  if (!customerData.phone?.trim()) {
    errors.phone = 'Số điện thoại không được để trống';
  } else if (!/^[0-9]{10,11}$/.test(customerData.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ (10-11 số)';
  }

  if (!customerData.dob) {
    errors.dob = 'Ngày sinh không được để trống';
  }

  if (!customerData.room_id) {
    errors.room_id = 'Phải chọn phòng';
  }

  if (!customerData.apartment_id) {
    errors.apartment_id = 'Phải chọn tòa nhà';
  }

  if (Object.keys(errors).length > 0) {
    throw new Error(JSON.stringify(errors));
  }

  // Register
  try {
    await customerService.register(customerData);
    return { success: true };
  } catch (error) {
    // Handle server errors
    if (error.response?.data?.message.includes('already exists')) {
      throw new Error('UUID đã tồn tại. Vui lòng dùng UUID khác!');
    }
    throw error;
  }
};
```

---

# ⚠️ Important Notes

## 1. Current Limitations

### Available:
- ✅ **Create customer** - POST /api/v1/rooms/register

### Not Available (Planned):
- ❌ **List customers** - GET /api/v1/customers
- ❌ **Get customer by ID** - GET /api/v1/customers/:id
- ❌ **Update customer** - PATCH /api/v1/customers/:id
- ❌ **Delete customer** - DELETE /api/v1/customers/:id
- ❌ **Search customers** - GET /api/v1/customers?search=...
- ❌ **Filter by room/apartment** - GET /api/v1/customers?room_id=...

---

## 2. Known Issues

### Issue 1: No Response Body
**Problem:** Endpoint không return response body khi thành công  
**Workaround:** Check HTTP status code 200

```javascript
if (response.status === 200) {
  // Success
}
```

### Issue 2: UUID Must Be Unique
**Problem:** UUID phải unique, không thể trùng  
**Solution:** 
- Generate unique UUID: `user_${Date.now()}_${Math.random()}`
- Hoặc dùng Zalo user ID (đã unique)

---

## 3. Data Relationships

```
Apartment (1) ------> (N) Room
                         |
                         |
                         v
                    Customer (N)
```

- Một Apartment có nhiều Rooms
- Một Room có nhiều Customers
- Customer phải thuộc về một Room và một Apartment

---

## 4. Best Practices

### ✅ DO:
- Validate tất cả fields trước khi submit
- Generate unique UUID nếu không có Zalo ID
- Check room và apartment tồn tại trước khi register
- Handle duplicate UUID error gracefully
- Show clear error messages
- Confirm trước khi submit (nếu cần)

### ❌ DON'T:
- Submit form nhiều lần (disable button khi loading)
- Hardcode UUID
- Skip validation
- Ignore error responses
- Allow empty required fields

---

## 5. UUID Generation

### Option 1: Timestamp-based
```javascript
const uuid = `user_${Date.now()}`;
```

### Option 2: Random
```javascript
const uuid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### Option 3: UUID Library
```javascript
import { v4 as uuidv4 } from 'uuid';
const uuid = uuidv4();
```

### Option 4: Zalo User ID
```javascript
const uuid = zaloUser.id; // From Zalo integration
```

---

# 🔮 Planned Features

## Coming Soon:

### Full CRUD APIs:
- ✅ `POST /api/v1/customers` - Create customer (new endpoint)
- ⏭️ `GET /api/v1/customers` - List all customers
- ⏭️ `GET /api/v1/customers/:id` - Get customer by ID
- ⏭️ `PATCH /api/v1/customers/:id` - Update customer
- ⏭️ `DELETE /api/v1/customers/:id` - Delete customer

### Advanced Features:
- ⏭️ Search customers by name/phone
- ⏭️ Filter by room/apartment
- ⏭️ Pagination
- ⏭️ Sort by name/created date
- ⏭️ Export customers to Excel
- ⏭️ Bulk operations

---

# 🆘 Troubleshooting

## Issue 1: "Missing required fields"
**Cause:** Thiếu một trong các fields bắt buộc  
**Solution:** Check tất cả fields: uuid, name, phone, dob, room_id, apartment_id

```javascript
// Validate before submit
const required = ['uuid', 'name', 'phone', 'dob', 'room_id', 'apartment_id'];
const missing = required.filter(field => !customerData[field]);
if (missing.length > 0) {
  throw new Error(`Missing: ${missing.join(', ')}`);
}
```

---

## Issue 2: "Customer with this UUID already exists"
**Cause:** UUID đã được sử dụng  
**Solution:** 
- Generate UUID mới
- Hoặc check UUID trước khi submit (nếu có API check)

```javascript
// Generate new UUID
const newUuid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

---

## Issue 3: No response after successful registration
**Cause:** Endpoint không return response body (known bug)  
**Solution:** Check HTTP status code

```javascript
if (response.status === 200) {
  // Success, even if body is empty
}
```

---

## Issue 4: Room/Apartment not found
**Cause:** room_id hoặc apartment_id không hợp lệ  
**Solution:**
- Verify IDs từ GET /apartments và GET /rooms
- Check IDs có đúng format ObjectId không
- Ensure apartment và room tồn tại

---

# 📝 Summary

## Current Endpoint:

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/api/v1/rooms/register` | Create customer | ✅ Working |

## Features:
- ✅ Create customer
- ✅ UUID uniqueness validation
- ✅ Required fields validation
- ⚠️ No response body (bug)

## Still Need:
- ⏭️ Full CRUD operations
- ⏭️ List/Search customers
- ⏭️ Update customer info
- ⏭️ Delete customer
- ⏭️ Response body fix

---

# 📞 Support

Nếu có vấn đề:
1. Check server logs
2. Verify MongoDB connection
3. Test bằng Swagger: `http://localhost:3321/api/v1/docs/`
4. Contact backend team

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0  
**Status:** Partial (Create only)

