# Customer API Integration Guide

## 📌 Overview

API để quản lý khách hàng (Customers) trong hệ thống The Room Manager. Hệ thống hỗ trợ tạo customer với hoặc không có phòng, và có thể gán/chuyển phòng sau.

**Base URL:** `http://localhost:3321/api/v1`

**Key Features:**
- ✅ Tạo customer với phòng ngay (one-step)
- ✅ Tạo customer chưa có phòng, gán sau (two-step)
- ✅ Chuyển customer từ phòng này sang phòng khác
- ✅ Full CRUD operations
- ✅ Search, filter, pagination

---

## 📋 Table of Contents

- [Customer Model Schema](#-customer-model-schema)
- [List Customers](#1%EF%B8%8F⃣-get-apiv1customers)
- [Get Customer by ID](#2%EF%B8%8F⃣-get-apiv1customersid)
- [Create Customer](#3%EF%B8%8F⃣-post-apiv1customers)
- [Update Customer](#4%EF%B8%8F⃣-patch-apiv1customersid)
- [Assign Customer to Room](#5%EF%B8%8F⃣-post-apiv1customersidassign-room)
- [Delete Customer](#6%EF%B8%8F⃣-delete-apiv1customersid)
- [React Integration Examples](#-react-integration-examples)
- [Use Cases & Best Practices](#-use-cases--scenarios)

---

# 📊 Customer Model Schema

## Data Structure

```typescript
interface Customer {
  _id: string;                    // MongoDB ObjectId
  uuid: string;                   // Unique identifier (Zalo UUID hoặc unique string)
  name: string;                   // Tên khách hàng (required)
  phone: string;                  // Số điện thoại
  dob: Date;                      // Ngày sinh
  room_id: string | null;         // Room ID (optional - có thể null)
  apartment_id: string | null;   // Apartment ID (optional - auto-set từ room)
  createdAt: Date;                // Thời gian tạo
  updatedAt: Date;                // Thời gian cập nhật
}
```

## Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | String | ✅ Yes | Unique identifier (thường là Zalo user UUID) |
| `name` | String | ✅ Yes | Tên đầy đủ của khách hàng |
| `phone` | String | ⚪ Optional | Số điện thoại |
| `dob` | Date/String | ⚪ Optional | Ngày sinh (ISO format: "1990-05-15") |
| `room_id` | String | ⚪ Optional | ID của phòng (có thể null - gán sau) |
| `apartment_id` | String | ⚪ Optional | ID của tòa nhà (tự động lấy từ room nếu có) |

**Important Notes:**
- `room_id` và `apartment_id` là **optional** - customer có thể tồn tại mà không có phòng
- Nếu chỉ cung cấp `room_id`, hệ thống tự động lấy `apartment_id` từ room
- Nếu cung cấp cả 2, hệ thống sẽ validate room thuộc apartment đó

---

# 1️⃣ GET /api/v1/customers

Lấy danh sách customers với pagination, search và filter.

## Request

```http
GET /api/v1/customers HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Number | ⚪ Optional | Số trang (default: 1) |
| `limit` | Number | ⚪ Optional | Số items mỗi trang (default: 10) |
| `sortBy` | String | ⚪ Optional | Field để sort (VD: "name", "createdAt") |
| `sortOrder` | String | ⚪ Optional | "asc" hoặc "desc" (default: "desc") |
| `search` | String | ⚪ Optional | Tìm kiếm theo name hoặc phone |
| `room_id` | String | ⚪ Optional | Filter theo room ID |
| `apartment_id` | String | ⚪ Optional | Filter theo apartment ID |

---

## Request Examples

### Basic List
```http
GET /api/v1/customers
```

### With Pagination
```http
GET /api/v1/customers?page=2&limit=20
```

### With Search
```http
GET /api/v1/customers?search=Nguyễn Văn A
```

### Filter by Room
```http
GET /api/v1/customers?room_id=673room001...
```

### Filter by Apartment
```http
GET /api/v1/customers?apartment_id=673apt001...
```

### Combined
```http
GET /api/v1/customers?page=1&limit=10&search=0901234567&room_id=673room001...&sortBy=name&sortOrder=asc
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Customers retrieved successfully",
  "data": {
    "rows": [
      {
        "_id": "673customer001...",
        "uuid": "zalo_user_12345",
        "name": "Nguyễn Văn A",
        "phone": "0901234567",
        "dob": "1990-05-15T00:00:00.000Z",
        "room_id": {
          "_id": "673room001...",
          "code": "A101"
        },
        "apartment_id": {
          "_id": "673apt001...",
          "code": "Building A"
        },
        "createdAt": "2025-11-14T10:00:00.000Z",
        "updatedAt": "2025-11-14T10:00:00.000Z"
      },
      {
        "_id": "673customer002...",
        "uuid": "zalo_user_67890",
        "name": "Trần Thị B",
        "phone": "0907654321",
        "dob": "1992-08-20T00:00:00.000Z",
        "room_id": null,
        "apartment_id": null,
        "createdAt": "2025-11-14T11:00:00.000Z",
        "updatedAt": "2025-11-14T11:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

**Note:** Customers không có phòng sẽ có `room_id: null` và `apartment_id: null`.

---

## Example Usage (Fetch)

```javascript
const getCustomers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    room_id = '',
    apartment_id = ''
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    ...(search && { search }),
    ...(room_id && { room_id }),
    ...(apartment_id && { apartment_id })
  });

  try {
    const response = await fetch(
      `http://localhost:3321/api/v1/customers?${params}`
    );
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        customers: data.data.rows,
        total: data.data.total,
        page: data.data.page,
        limit: data.data.limit
      };
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Usage
const { customers, total } = await getCustomers({
  page: 1,
  limit: 20,
  search: 'Nguyễn',
  room_id: '673room001...'
});
```

---

## Example Usage (React Hook)

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useCustomers = (initialFilters = {}) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    room_id: '',
    apartment_id: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get('http://localhost:3321/api/v1/customers', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        }
      });

      setCustomers(data.data.rows);
      setPagination(prev => ({
        ...prev,
        total: data.data.total
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, filters]);

  const changePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    customers,
    loading,
    error,
    pagination,
    filters,
    changePage,
    updateFilters,
    refetch: fetchCustomers
  };
};

// Usage
function CustomerList() {
  const {
    customers,
    loading,
    error,
    pagination,
    filters,
    changePage,
    updateFilters
  } = useCustomers();

  return (
    <div>
      {/* Filters */}
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={filters.search}
        onChange={(e) => updateFilters({ search: e.target.value })}
      />

      {/* List */}
      {customers.map(customer => (
        <div key={customer._id}>
          <h3>{customer.name}</h3>
          <p>Phone: {customer.phone}</p>
          <p>
            Room: {customer.room_id?.code || 'Chưa có phòng'}
          </p>
        </div>
      ))}

      {/* Pagination */}
      <div>
        <button onClick={() => changePage(pagination.page - 1)}>
          Previous
        </button>
        <span>Page {pagination.page}</span>
        <button onClick={() => changePage(pagination.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
```

---

# 2️⃣ GET /api/v1/customers/:id

Lấy chi tiết một customer theo ID.

## Request

```http
GET /api/v1/customers/:id HTTP/1.1
Host: localhost:3321
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Customer ID (MongoDB ObjectId) |

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Customer retrieved successfully",
  "data": {
    "_id": "673customer001...",
    "uuid": "zalo_user_12345",
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "dob": "1990-05-15T00:00:00.000Z",
    "room_id": {
      "_id": "673room001...",
      "code": "A101"
    },
    "apartment_id": {
      "_id": "673apt001...",
      "code": "Building A"
    },
    "createdAt": "2025-11-14T10:00:00.000Z",
    "updatedAt": "2025-11-14T10:00:00.000Z"
  }
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Customer not found"
}
```

---

## Example Usage

```javascript
const getCustomerById = async (customerId) => {
  try {
    const { data } = await axios.get(
      `http://localhost:3321/api/v1/customers/${customerId}`
    );
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy khách hàng');
    }
    throw error;
  }
};
```

---

# 3️⃣ POST /api/v1/customers

Tạo customer mới. **Room assignment là optional** - có thể tạo customer chưa có phòng và gán sau.

## Request

```http
POST /api/v1/customers HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | String | ✅ Yes | Unique identifier |
| `name` | String | ✅ Yes | Tên khách hàng |
| `phone` | String | ⚪ Optional | Số điện thoại |
| `dob` | String | ⚪ Optional | Ngày sinh (ISO format: YYYY-MM-DD) |
| `room_id` | String | ⚪ Optional | Room ID (có thể null) |
| `apartment_id` | String | ⚪ Optional | Apartment ID (tự động lấy từ room nếu không có) |

---

## Request Body Examples

### Example 1: Create with Room (One-step)
```json
{
  "uuid": "zalo_user_12345",
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "dob": "1990-05-15",
  "room_id": "673room001..."
}
```

**Note:** Chỉ cần `room_id`, `apartment_id` sẽ tự động lấy từ room.

### Example 2: Create without Room (Two-step)
```json
{
  "uuid": "zalo_user_67890",
  "name": "Trần Thị B",
  "phone": "0907654321",
  "dob": "1992-08-20"
}
```

**Note:** Không có `room_id` - customer được tạo chưa có phòng. Sau đó dùng `POST /customers/:id/assign-room` để gán phòng.

### Example 3: Create with Both Room and Apartment
```json
{
  "uuid": "zalo_user_11111",
  "name": "Lê Văn C",
  "phone": "0901111111",
  "dob": "1988-03-10",
  "room_id": "673room001...",
  "apartment_id": "673apt001..."
}
```

**Note:** Nếu cung cấp cả 2, hệ thống sẽ validate room thuộc apartment đó.

---

## Response Success (201 Created)

### With Room Assigned
```json
{
  "status": "success",
  "message": "Customer created and assigned to room successfully",
  "data": {
    "_id": "673customer001...",
    "uuid": "zalo_user_12345",
    "name": "Nguyễn Văn A",
    "phone": "0901234567",
    "dob": "1990-05-15T00:00:00.000Z",
    "room_id": {
      "_id": "673room001...",
      "code": "A101"
    },
    "apartment_id": {
      "_id": "673apt001...",
      "code": "Building A"
    },
    "createdAt": "2025-11-14T10:00:00.000Z",
    "updatedAt": "2025-11-14T10:00:00.000Z"
  }
}
```

### Without Room
```json
{
  "status": "success",
  "message": "Customer created successfully (no room assigned yet)",
  "data": {
    "_id": "673customer002...",
    "uuid": "zalo_user_67890",
    "name": "Trần Thị B",
    "phone": "0907654321",
    "dob": "1992-08-20T00:00:00.000Z",
    "room_id": null,
    "apartment_id": null,
    "createdAt": "2025-11-14T11:00:00.000Z",
    "updatedAt": "2025-11-14T11:00:00.000Z"
  }
}
```

---

## Error Responses

### 400 Bad Request - Missing Required Fields
```json
{
  "status": "fail",
  "message": "Missing required fields: uuid, name, phone, dob"
}
```

### 400 Bad Request - UUID Already Exists
```json
{
  "status": "fail",
  "message": "Customer with this UUID already exists"
}
```

### 404 Not Found - Room Not Found
```json
{
  "status": "fail",
  "message": "Room not found"
}
```

### 400 Bad Request - Room Not in Apartment
```json
{
  "status": "fail",
  "message": "Room does not belong to the specified apartment"
}
```

---

## Example Usage (React Form - One-step)

```javascript
function CreateCustomerWithRoomForm() {
  const [formData, setFormData] = useState({
    uuid: `user_${Date.now()}`,
    name: '',
    phone: '',
    dob: '',
    room_id: '',
    apartment_id: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        'http://localhost:3321/api/v1/customers',
        {
          uuid: formData.uuid,
          name: formData.name,
          phone: formData.phone,
          dob: formData.dob,
          room_id: formData.room_id  // Gán phòng ngay
        }
      );
      
      alert('Tạo khách hàng và gán phòng thành công!');
      // Reset form
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Tạo khách hàng mới</h2>
      
      <input
        type="text"
        placeholder="Họ tên *"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />

      <input
        type="tel"
        placeholder="Số điện thoại"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />

      <input
        type="date"
        value={formData.dob}
        onChange={(e) => setFormData({...formData, dob: e.target.value})}
      />

      <ApartmentSelect
        value={formData.apartment_id}
        onChange={(val) => setFormData({
          ...formData,
          apartment_id: val,
          room_id: ''  // Reset room
        })}
      />

      <RoomSelect
        apartmentId={formData.apartment_id}
        value={formData.room_id}
        onChange={(val) => setFormData({...formData, room_id: val})}
      />

      <button type="submit" disabled={loading || !formData.room_id}>
        {loading ? 'Đang tạo...' : 'Tạo và gán phòng'}
      </button>
    </form>
  );
}
```

---

## Example Usage (React Form - Two-step)

```javascript
function CreateCustomerTwoStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    uuid: `user_${Date.now()}`,
    name: '',
    phone: '',
    dob: ''
  });
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Create customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        'http://localhost:3321/api/v1/customers',
        formData  // Không có room_id
      );
      
      setCreatedCustomer(data.data);
      setStep(2);  // Chuyển sang step 2
      alert('Tạo khách hàng thành công! Giờ gán phòng.');
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Assign room
  const handleAssignRoom = async (roomId) => {
    setLoading(true);

    try {
      await axios.post(
        `http://localhost:3321/api/v1/customers/${createdCustomer._id}/assign-room`,
        { room_id: roomId }
      );
      
      alert('Gán phòng thành công!');
      // Reset hoặc redirect
    } catch (error) {
      alert('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 1 && (
        <form onSubmit={handleCreateCustomer}>
          <h2>Bước 1: Tạo khách hàng</h2>
          
          <input
            type="text"
            placeholder="Họ tên *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />

          <input
            type="tel"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />

          <input
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({...formData, dob: e.target.value})}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo khách hàng'}
          </button>
        </form>
      )}

      {step === 2 && createdCustomer && (
        <div>
          <h2>Bước 2: Gán phòng cho {createdCustomer.name}</h2>
          
          <RoomSelector onSelect={handleAssignRoom} />
        </div>
      )}
    </div>
  );
}
```

---

# 4️⃣ PATCH /api/v1/customers/:id

Cập nhật thông tin customer (name, phone, dob). Để gán/chuyển phòng, dùng endpoint `assign-room` riêng.

## Request

```http
PATCH /api/v1/customers/:id HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | ⚪ Optional | Tên khách hàng |
| `phone` | String | ⚪ Optional | Số điện thoại |
| `dob` | String | ⚪ Optional | Ngày sinh |
| `room_id` | String | ⚪ Optional | Room ID (có thể update, nhưng nên dùng assign-room) |
| `apartment_id` | String | ⚪ Optional | Apartment ID (có thể update) |

---

## Request Body Example

```json
{
  "name": "Nguyễn Văn A Updated",
  "phone": "0909999999",
  "dob": "1990-05-20"
}
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Customer updated successfully",
  "data": {
    "_id": "673customer001...",
    "uuid": "zalo_user_12345",
    "name": "Nguyễn Văn A Updated",
    "phone": "0909999999",
    "dob": "1990-05-20T00:00:00.000Z",
    "room_id": {
      "_id": "673room001...",
      "code": "A101"
    },
    "apartment_id": {
      "_id": "673apt001...",
      "code": "Building A"
    }
  }
}
```

---

## Example Usage

```javascript
const updateCustomer = async (customerId, updates) => {
  try {
    const { data } = await axios.patch(
      `http://localhost:3321/api/v1/customers/${customerId}`,
      updates
    );
    return data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Usage
await updateCustomer('customer_id', {
  name: 'New Name',
  phone: '0909999999'
});
```

---

# 5️⃣ POST /api/v1/customers/:id/assign-room

**Gán hoặc chuyển customer vào phòng.** Endpoint này rõ ràng hơn và UX tốt hơn so với dùng PATCH.

## Request

```http
POST /api/v1/customers/:id/assign-room HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Customer ID |

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `room_id` | String | ✅ Yes | Room ID để gán |

---

## Request Body Example

```json
{
  "room_id": "673room001..."
}
```

---

## Response Success (200 OK)

### Assign to New Room
```json
{
  "status": "success",
  "message": "Customer assigned to room A101 successfully",
  "data": {
    "_id": "673customer001...",
    "uuid": "zalo_user_12345",
    "name": "Nguyễn Văn A",
    "room_id": {
      "_id": "673room001...",
      "code": "A101"
    },
    "apartment_id": {
      "_id": "673apt001...",
      "code": "Building A"
    }
  }
}
```

### Move to Different Room
```json
{
  "status": "success",
  "message": "Customer moved to room B202 successfully",
  "data": {
    "_id": "673customer001...",
    "room_id": {
      "_id": "673room002...",
      "code": "B202"
    },
    "apartment_id": {
      "_id": "673apt002...",
      "code": "Building B"
    }
  }
}
```

---

## Error Responses

### 400 Bad Request - Missing room_id
```json
{
  "status": "fail",
  "message": "room_id is required"
}
```

### 404 Not Found - Customer Not Found
```json
{
  "status": "fail",
  "message": "Customer not found"
}
```

### 404 Not Found - Room Not Found
```json
{
  "status": "fail",
  "message": "Room not found"
}
```

---

## Example Usage (React Component)

```javascript
function AssignRoomToCustomer({ customer, onSuccess }) {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAssign = async () => {
    if (!roomId) {
      setError('Vui lòng chọn phòng');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `http://localhost:3321/api/v1/customers/${customer._id}/assign-room`,
        { room_id: roomId }
      );
      
      alert(data.message);
      onSuccess?.(data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-room">
      <h3>
        {customer.room_id 
          ? `Chuyển ${customer.name} sang phòng khác`
          : `Gán phòng cho ${customer.name}`
        }
      </h3>

      {customer.room_id && (
        <p>Phòng hiện tại: {customer.room_id.code}</p>
      )}

      <RoomSelect
        value={roomId}
        onChange={setRoomId}
        excludeRoomId={customer.room_id?._id}  // Exclude current room
      />

      {error && <p className="error">{error}</p>}

      <button onClick={handleAssign} disabled={loading || !roomId}>
        {loading 
          ? 'Đang xử lý...' 
          : customer.room_id 
            ? 'Chuyển phòng' 
            : 'Gán phòng'
        }
      </button>
    </div>
  );
}
```

---

# 6️⃣ DELETE /api/v1/customers/:id

Xóa customer.

## Request

```http
DELETE /api/v1/customers/:id HTTP/1.1
Host: localhost:3321
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Customer ID |

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Customer deleted successfully",
  "data": {
    "deleted_id": "673customer001...",
    "deleted_name": "Nguyễn Văn A"
  }
}
```

---

## Example Usage

```javascript
const deleteCustomer = async (customerId) => {
  if (!window.confirm('Bạn chắc chắn muốn xóa khách hàng này?')) {
    return;
  }

  try {
    const { data } = await axios.delete(
      `http://localhost:3321/api/v1/customers/${customerId}`
    );
    alert('Xóa thành công!');
    return true;
  } catch (error) {
    alert('Lỗi: ' + (error.response?.data?.message || error.message));
    return false;
  }
};
```

---

# 🔧 React Integration Examples

## Complete Service Layer

```javascript
// services/customerService.js
import axios from 'axios';

const API_BASE = 'http://localhost:3321/api/v1';

export const customerService = {
  // List customers
  getAll: async (options = {}) => {
    const { data } = await axios.get(`${API_BASE}/customers`, {
      params: {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc',
        ...(options.search && { search: options.search }),
        ...(options.room_id && { room_id: options.room_id }),
        ...(options.apartment_id && { apartment_id: options.apartment_id })
      }
    });
    return {
      customers: data.data.rows,
      total: data.data.total,
      page: data.data.page,
      limit: data.data.limit
    };
  },

  // Get by ID
  getById: async (id) => {
    const { data } = await axios.get(`${API_BASE}/customers/${id}`);
    return data.data;
  },

  // Create
  create: async (customerData) => {
    const { data } = await axios.post(`${API_BASE}/customers`, customerData);
    return data.data;
  },

  // Update
  update: async (id, updates) => {
    const { data } = await axios.patch(`${API_BASE}/customers/${id}`, updates);
    return data.data;
  },

  // Assign room
  assignRoom: async (id, roomId) => {
    const { data } = await axios.post(
      `${API_BASE}/customers/${id}/assign-room`,
      { room_id: roomId }
    );
    return data.data;
  },

  // Delete
  delete: async (id) => {
    const { data } = await axios.delete(`${API_BASE}/customers/${id}`);
    return data.data;
  }
};
```

---

## Complete Customer Management Component

```javascript
import { useState, useEffect } from 'react';
import { customerService } from '../services';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [filters, setFilters] = useState({ search: '', room_id: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAssignRoom, setShowAssignRoom] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [pagination.page, filters]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await customerService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      setCustomers(result.customers);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoom = (customer) => {
    setSelectedCustomer(customer);
    setShowAssignRoom(true);
  };

  const handleRoomAssigned = async (roomId) => {
    try {
      await customerService.assignRoom(selectedCustomer._id, roomId);
      alert('Gán phòng thành công!');
      setShowAssignRoom(false);
      loadCustomers();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  return (
    <div className="customer-management">
      <h1>Quản lý Khách hàng</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
      </div>

      {/* List */}
      <table>
        <thead>
          <tr>
            <th>Tên</th>
            <th>SĐT</th>
            <th>Phòng</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr key={customer._id}>
              <td>{customer.name}</td>
              <td>{customer.phone}</td>
              <td>
                {customer.room_id ? (
                  <span>{customer.room_id.code}</span>
                ) : (
                  <span className="no-room">Chưa có phòng</span>
                )}
              </td>
              <td>
                {!customer.room_id && (
                  <button onClick={() => handleAssignRoom(customer)}>
                    Gán phòng
                  </button>
                )}
                {customer.room_id && (
                  <button onClick={() => handleAssignRoom(customer)}>
                    Đổi phòng
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Assign Room Modal */}
      {showAssignRoom && selectedCustomer && (
        <AssignRoomModal
          customer={selectedCustomer}
          onAssign={handleRoomAssigned}
          onClose={() => setShowAssignRoom(false)}
        />
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPagination({...pagination, page: pagination.page - 1})}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span>Page {pagination.page}</span>
        <button
          onClick={() => setPagination({...pagination, page: pagination.page + 1})}
          disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

# 🎯 Use Cases & Scenarios

## Use Case 1: Create Customer with Room (One-step)

**Scenario:** Khách hàng mới đã biết phòng sẽ ở.

```javascript
const createCustomerWithRoom = async (customerData, roomId) => {
  try {
    const customer = await customerService.create({
      ...customerData,
      room_id: roomId  // Gán phòng ngay
    });
    
    console.log(`Customer ${customer.name} created and assigned to room ${customer.room_id.code}`);
    return customer;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## Use Case 2: Create Customer First, Assign Room Later (Two-step)

**Scenario:** Khách hàng mới chưa biết phòng, sẽ gán sau.

```javascript
// Step 1: Create customer
const customer = await customerService.create({
  uuid: 'user_123',
  name: 'Nguyễn Văn A',
  phone: '0901234567',
  dob: '1990-05-15'
  // Không có room_id
});

console.log('Customer created:', customer.name);

// Step 2: Assign room later
const roomId = '673room001...';
await customerService.assignRoom(customer._id, roomId);
console.log('Room assigned!');
```

---

## Use Case 3: Move Customer to Different Room

**Scenario:** Khách hàng chuyển từ phòng này sang phòng khác.

```javascript
const moveCustomer = async (customerId, newRoomId) => {
  try {
    const customer = await customerService.getById(customerId);
    const oldRoom = customer.room_id?.code || 'no room';
    
    const updated = await customerService.assignRoom(customerId, newRoomId);
    const newRoom = updated.room_id?.code;
    
    console.log(`Moved customer from ${oldRoom} to ${newRoom}`);
    return updated;
  } catch (error) {
    console.error('Error moving customer:', error);
    throw error;
  }
};
```

---

## Use Case 4: Bulk Assign Customers to Rooms

**Scenario:** Gán nhiều customers vào các phòng khác nhau.

```javascript
const bulkAssignRooms = async (assignments) => {
  // assignments = [{ customerId, roomId }, ...]
  const results = {
    success: [],
    failed: []
  };

  for (const { customerId, roomId } of assignments) {
    try {
      const customer = await customerService.assignRoom(customerId, roomId);
      results.success.push({ customerId, customer });
    } catch (error) {
      results.failed.push({ customerId, error: error.message });
    }
  }

  console.log(`Success: ${results.success.length}, Failed: ${results.failed.length}`);
  return results;
};

// Usage
await bulkAssignRooms([
  { customerId: 'customer1', roomId: 'room1' },
  { customerId: 'customer2', roomId: 'room2' },
  { customerId: 'customer3', roomId: 'room3' }
]);
```

---

## Use Case 5: Find Customers Without Room

**Scenario:** Tìm tất cả customers chưa có phòng để gán.

```javascript
const getCustomersWithoutRoom = async () => {
  const allCustomers = await customerService.getAll({ limit: 1000 });
  
  // Filter customers without room
  const customersWithoutRoom = allCustomers.customers.filter(
    customer => !customer.room_id
  );
  
  return customersWithoutRoom;
};

// Usage
const unassignedCustomers = await getCustomersWithoutRoom();
console.log(`Found ${unassignedCustomers.length} customers without room`);
```

---

## Use Case 6: Customer Registration Wizard

**Scenario:** Multi-step form để tạo customer và gán phòng.

```javascript
function CustomerRegistrationWizard() {
  const [step, setStep] = useState(1);
  const [customerData, setCustomerData] = useState({
    uuid: `user_${Date.now()}`,
    name: '',
    phone: '',
    dob: ''
  });
  const [createdCustomer, setCreatedCustomer] = useState(null);
  const [roomId, setRoomId] = useState('');

  // Step 1: Create customer
  const handleStep1 = async (e) => {
    e.preventDefault();
    try {
      const customer = await customerService.create(customerData);
      setCreatedCustomer(customer);
      setStep(2);
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  // Step 2: Assign room (optional)
  const handleStep2 = async () => {
    if (!roomId) {
      // Skip room assignment
      alert('Đã tạo khách hàng. Có thể gán phòng sau!');
      return;
    }

    try {
      await customerService.assignRoom(createdCustomer._id, roomId);
      alert('Hoàn tất! Khách hàng đã được gán phòng.');
      // Reset or redirect
    } catch (error) {
      alert('Lỗi gán phòng: ' + error.message);
    }
  };

  return (
    <div className="wizard">
      {step === 1 && (
        <form onSubmit={handleStep1}>
          <h2>Bước 1: Thông tin khách hàng</h2>
          {/* Customer form fields */}
          <button type="submit">Tiếp theo</button>
        </form>
      )}

      {step === 2 && (
        <div>
          <h2>Bước 2: Gán phòng (Tùy chọn)</h2>
          <p>Khách hàng: {createdCustomer.name}</p>
          
          <RoomSelect value={roomId} onChange={setRoomId} />
          
          <button onClick={handleStep2}>
            {roomId ? 'Hoàn tất' : 'Bỏ qua (gán sau)'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

# ⚠️ Important Notes

## 1. Room Assignment Logic

### Auto-apartment Assignment:
- Nếu chỉ cung cấp `room_id`, hệ thống tự động lấy `apartment_id` từ room
- Không cần cung cấp `apartment_id` khi có `room_id`

### Validation:
- Nếu cung cấp cả `room_id` và `apartment_id`, hệ thống validate room thuộc apartment đó
- Nếu không match → Error 400

---

## 2. UUID Uniqueness

- `uuid` phải unique trong toàn hệ thống
- Nếu trùng → Error 400
- **Recommendation:** Dùng Zalo user ID hoặc generate unique string

---

## 3. Best Practices

### ✅ DO:
- **One-step:** Tạo customer với room nếu đã biết phòng
- **Two-step:** Tạo customer trước, gán phòng sau nếu chưa biết
- Validate UUID trước khi tạo
- Check room tồn tại trước khi assign
- Show clear messages (assigned vs moved)
- Handle customers without room gracefully

### ❌ DON'T:
- Hardcode UUIDs
- Skip validation
- Ignore errors
- Create duplicate UUIDs
- Assume customer always has room

---

## 4. Data Relationships

```
Customer (N) ------> (1) Room
                         |
                         |
                         v
                    Apartment (1)
```

- Một Customer thuộc về một Room (hoặc null)
- Một Room có nhiều Customers
- Một Room thuộc về một Apartment
- Customer có thể không có Room (room_id = null)

---

## 5. Filtering Customers

### By Room:
```javascript
GET /api/v1/customers?room_id=673room001...
```

### By Apartment:
```javascript
GET /api/v1/customers?apartment_id=673apt001...
```

### Without Room:
```javascript
// Get all customers
const all = await customerService.getAll({ limit: 1000 });
const withoutRoom = all.customers.filter(c => !c.room_id);
```

---

# 🆘 Troubleshooting

## Issue 1: "Customer with this UUID already exists"
**Cause:** UUID đã được sử dụng  
**Solution:**
- Generate UUID mới
- Check existing customers trước khi tạo
- Dùng Zalo user ID (đã unique)

---

## Issue 2: "Room not found"
**Cause:** `room_id` không hợp lệ hoặc đã bị xóa  
**Solution:**
- Verify room tồn tại: GET /rooms
- Check room_id format (ObjectId)
- Ensure room chưa bị xóa

---

## Issue 3: "Room does not belong to the specified apartment"
**Cause:** Room không thuộc apartment được chỉ định  
**Solution:**
- Chỉ cung cấp `room_id` (apartment_id sẽ auto-set)
- Hoặc verify room thuộc apartment trước khi tạo

---

## Issue 4: Customer không có phòng sau khi tạo
**Cause:** Đây là behavior bình thường nếu không cung cấp `room_id`  
**Solution:**
- Đây không phải lỗi - customer có thể tồn tại không có phòng
- Dùng `POST /customers/:id/assign-room` để gán phòng sau

---

# 📝 Summary

## Endpoints:

| Method | Endpoint | Purpose | UX |
|--------|----------|---------|-----|
| GET | `/api/v1/customers` | List với filters | ✅ |
| GET | `/api/v1/customers/:id` | Get by ID | ✅ |
| POST | `/api/v1/customers` | Create (room optional) | ✅ Flexible |
| PATCH | `/api/v1/customers/:id` | Update info | ✅ |
| POST | `/api/v1/customers/:id/assign-room` | Assign/Change room | ✅ Clear intent |
| DELETE | `/api/v1/customers/:id` | Delete | ✅ |

## Key Features:
- ✅ Flexible room assignment (one-step or two-step)
- ✅ Auto apartment assignment from room
- ✅ Clear assign vs move messages
- ✅ Full CRUD operations
- ✅ Search, filter, pagination
- ✅ Populate room & apartment info

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0  
**Status:** Production Ready
