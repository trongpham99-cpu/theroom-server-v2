# Invoice API Integration Guide

## 📌 Overview

API để quản lý hóa đơn (Invoices) trong hệ thống The Room Manager. Hệ thống hỗ trợ tạo, gửi, và quản lý hóa đơn điện nước cho khách hàng.

**Base URL:** `http://localhost:3321/api/v1`

**Note:** ⚠️ Một số tính năng gửi hóa đơn qua Zalo ZNS có thể chưa hoạt động đầy đủ nếu chưa cấu hình Zalo service.

---

## 📋 Table of Contents

- [Invoice Model Schema](#-invoice-model-schema)
- [List Invoices](#1%EF%B8%8F⃣-get-apiv1invoices)
- [Get Invoice by ID](#2%EF%B8%8F⃣-get-apiv1invoicesid)
- [Create Invoice](#3%EF%B8%8F⃣-post-apiv1invoices)
- [Send Invoice (Single)](#4%EF%B8%8F⃣-post-apiv1invoicesidsend)
- [Send Multiple Invoices](#5%EF%B8%8F⃣-post-apiv1invoicessend-many)
- [Get Report](#6%EF%B8%8F⃣-get-apiv1invoicesreport)
- [Sync from Google Sheets](#7%EF%B8%8F⃣-post-apiv1invoicessync-file-sheet)
- [React Integration Examples](#-react-integration-examples)
- [Use Cases & Best Practices](#-use-cases--scenarios)

---

# 📊 Invoice Model Schema

## Data Structure

```typescript
interface Invoice {
  _id: string;                    // MongoDB ObjectId
  room_code: string;              // Mã phòng
  customer_name: string;          // Tên khách hàng
  gender: 'Nam' | 'Nữ' | 'N/A';  // Giới tính
  birth_date: Date;              // Ngày sinh
  phone: string;                  // Số điện thoại (required)
  
  // Contract
  contract: {
    start_date: Date;            // Ngày vào
    end_date: Date;              // Ngày hết hạn
    duration_months: number;     // Kỳ hạn hợp đồng
  };
  
  // Deposit
  deposit_amount: number;        // Tiền cọc
  
  // Room fee
  room_price: number;            // Giá phòng
  stay_days: number;             // Số ngày ở
  actual_room_fee: number;       // Tiền phòng thực tế
  
  // Electricity
  electricity: {
    old_index: number;           // Chỉ số cũ
    new_index: number;           // Chỉ số mới
    used_kwh: number;            // Số kWh đã dùng
    price: number;               // Tiền điện
    staff: string;               // Người ghi điện
  };
  
  // Water & Management
  water_usage: number;            // Số người dùng nước (default: 1)
  water_fee: number;              // Tiền nước
  management_fee: number;        // Phí quản lý
  
  // Other
  old_debt: number;              // Nợ cũ
  deduction: number;             // Giảm trừ
  total_amount: number;          // Tổng tiền
  amount_paid: number;           // Đã thanh toán
  remaining_amount: number;      // Còn lại
  
  // Notes
  note: string;                  // Ghi chú
  extra_note: string;            // Ghi chú thêm
  
  // Status
  invoice_status: 1 | 2 | 3 | 4; // 1: pending, 2: sent, 3: paid, 4: failed
  invoice_message: string;       // Thông báo trạng thái
  
  // Period
  month: number;                 // Tháng (1-12)
  year: number;                  // Năm
  
  // History
  history: Array<{
    status: number;
    message: string;
    created_at: Date;
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

## Invoice Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 1 | Pending | Chưa gửi |
| 2 | Sent | Đã gửi qua Zalo |
| 3 | Paid | Đã thanh toán |
| 4 | Failed | Gửi thất bại |

---

# 1️⃣ GET /api/v1/invoices

Lấy danh sách hóa đơn với pagination, search và sorting.

## Request

```http
GET /api/v1/invoices HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | Number | ⚪ Optional | Số trang (default: 1) |
| `limit` | Number | ⚪ Optional | Số items mỗi trang (default: 10) |
| `sortBy` | String | ⚪ Optional | Field để sort (VD: "createdAt", "total_amount") |
| `sortOrder` | String | ⚪ Optional | "asc" hoặc "desc" (default: "desc") |
| `search` | String | ⚪ Optional | Tìm kiếm theo customer_name, phone, room_code |

---

## Request Examples

### Basic List
```http
GET /api/v1/invoices
```

### With Pagination
```http
GET /api/v1/invoices?page=2&limit=20
```

### With Search
```http
GET /api/v1/invoices?search=Nguyễn Văn A
```

### With Sorting
```http
GET /api/v1/invoices?sortBy=total_amount&sortOrder=desc
```

### Combined
```http
GET /api/v1/invoices?page=1&limit=10&sortBy=createdAt&sortOrder=desc&search=A101
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Invoices retrieved successfully",
  "data": {
    "rows": [
      {
        "_id": "673invoice001...",
        "room_code": "A101",
        "customer_name": "Nguyễn Văn A",
        "phone": "0901234567",
        "gender": "Nam",
        "total_amount": 3500000,
        "invoice_status": 2,
        "month": 11,
        "year": 2025,
        "createdAt": "2025-11-14T10:00:00.000Z"
      }
    ],
    "total": 150
  }
}
```

---

## Example Usage (Fetch)

```javascript
const getInvoices = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = ''
  } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
    ...(search && { search })
  });

  try {
    const response = await fetch(
      `http://localhost:3321/api/v1/invoices?${params}`
    );
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        invoices: data.data.rows,
        total: data.data.total,
        page,
        limit
      };
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

// Usage
const { invoices, total } = await getInvoices({
  page: 1,
  limit: 20,
  search: 'A101'
});
```

---

## Example Usage (Axios)

```javascript
import axios from 'axios';

const getInvoices = async (options = {}) => {
  try {
    const { data } = await axios.get('http://localhost:3321/api/v1/invoices', {
      params: {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc',
        ...(options.search && { search: options.search })
      }
    });
    
    return {
      invoices: data.data.rows,
      total: data.data.total,
      page: options.page || 1,
      limit: options.limit || 10
    };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};
```

---

## Example Usage (React Hook with Pagination)

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useInvoices = (initialOptions = {}) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialOptions
  });

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get('http://localhost:3321/api/v1/invoices', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        }
      });

      setInvoices(data.data.rows);
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
    fetchInvoices();
  }, [pagination.page, pagination.limit, filters]);

  const changePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const changeLimit = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    invoices,
    loading,
    error,
    pagination,
    filters,
    changePage,
    changeLimit,
    updateFilters,
    refetch: fetchInvoices
  };
};

// Usage in component
function InvoiceList() {
  const {
    invoices,
    loading,
    error,
    pagination,
    filters,
    changePage,
    changeLimit,
    updateFilters
  } = useInvoices();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={filters.search}
        onChange={(e) => updateFilters({ search: e.target.value })}
      />

      {/* Sort */}
      <select
        value={filters.sortBy}
        onChange={(e) => updateFilters({ sortBy: e.target.value })}
      >
        <option value="createdAt">Ngày tạo</option>
        <option value="total_amount">Tổng tiền</option>
        <option value="customer_name">Tên khách</option>
      </select>

      {/* List */}
      <table>
        <thead>
          <tr>
            <th>Mã phòng</th>
            <th>Khách hàng</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Tháng/Năm</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice._id}>
              <td>{invoice.room_code}</td>
              <td>{invoice.customer_name}</td>
              <td>{invoice.total_amount.toLocaleString()}đ</td>
              <td>{getStatusLabel(invoice.invoice_status)}</td>
              <td>{invoice.month}/{invoice.year}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => changePage(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
        </span>
        <button
          onClick={() => changePage(pagination.page + 1)}
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

# 2️⃣ GET /api/v1/invoices/:id

Lấy chi tiết một hóa đơn theo ID.

## Request

```http
GET /api/v1/invoices/:id HTTP/1.1
Host: localhost:3321
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Invoice ID (MongoDB ObjectId) |

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Invoice retrieved successfully",
  "data": {
    "_id": "673invoice001...",
    "room_code": "A101",
    "customer_name": "Nguyễn Văn A",
    "gender": "Nam",
    "birth_date": "1990-05-15T00:00:00.000Z",
    "phone": "0901234567",
    "contract": {
      "start_date": "2025-01-01T00:00:00.000Z",
      "end_date": "2025-12-31T00:00:00.000Z",
      "duration_months": 12
    },
    "deposit_amount": 3000000,
    "room_price": 3000000,
    "stay_days": 30,
    "actual_room_fee": 3000000,
    "electricity": {
      "old_index": 100,
      "new_index": 150,
      "used_kwh": 50,
      "price": 200000,
      "staff": "Admin"
    },
    "water_usage": 1,
    "water_fee": 100000,
    "management_fee": 200000,
    "old_debt": 0,
    "deduction": 0,
    "total_amount": 3500000,
    "amount_paid": 0,
    "remaining_amount": 3500000,
    "note": "",
    "extra_note": "",
    "invoice_status": 1,
    "invoice_message": null,
    "month": 11,
    "year": 2025,
    "history": [],
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
  "error": "Invoice not found"
}
```

---

## Example Usage

```javascript
const getInvoiceById = async (invoiceId) => {
  try {
    const { data } = await axios.get(
      `http://localhost:3321/api/v1/invoices/${invoiceId}`
    );
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy hóa đơn');
    }
    throw error;
  }
};
```

---

# 3️⃣ POST /api/v1/invoices

Tạo hóa đơn mới.

## Request

```http
POST /api/v1/invoices HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `room_code` | String | ⚪ Optional | Mã phòng |
| `customer_name` | String | ⚪ Optional | Tên khách hàng |
| `gender` | String | ⚪ Optional | "Nam", "Nữ", "N/A" (default: "Nam") |
| `birth_date` | String | ⚪ Optional | Ngày sinh (ISO format) |
| `phone` | String | ✅ Yes | Số điện thoại |
| `contract` | Object | ⚪ Optional | Thông tin hợp đồng |
| `contract.start_date` | String | ⚪ Optional | Ngày vào |
| `contract.end_date` | String | ⚪ Optional | Ngày hết hạn |
| `contract.duration_months` | Number | ⚪ Optional | Kỳ hạn (tháng) |
| `deposit_amount` | Number | ⚪ Optional | Tiền cọc (default: 0) |
| `room_price` | Number | ⚪ Optional | Giá phòng (default: 0) |
| `stay_days` | Number | ⚪ Optional | Số ngày ở (default: 30) |
| `electricity` | Object | ⚪ Optional | Thông tin điện |
| `electricity.old_index` | Number | ⚪ Optional | Chỉ số cũ (default: 0) |
| `electricity.new_index` | Number | ⚪ Optional | Chỉ số mới (default: 0) |
| `electricity.staff` | String | ⚪ Optional | Người ghi điện |
| `water_fee` | Number | ⚪ Optional | Tiền nước (default: 0) |
| `management_fee` | Number | ⚪ Optional | Phí quản lý (default: 0) |
| `old_debt` | Number | ⚪ Optional | Nợ cũ (default: 0) |
| `deduction` | Number | ⚪ Optional | Giảm trừ (default: 0) |
| `note` | String | ⚪ Optional | Ghi chú |
| `extra_note` | String | ⚪ Optional | Ghi chú thêm |
| `month` | Number | ⚪ Optional | Tháng (1-12) |
| `year` | Number | ⚪ Optional | Năm |

**Note:** 
- `used_kwh` và `electricity.price` được tính tự động từ `old_index` và `new_index`
- `total_amount` được tính tự động
- `actual_room_fee` = `room_price` (có thể điều chỉnh sau)

---

## Request Body Example

```json
{
  "room_code": "A101",
  "customer_name": "Nguyễn Văn A",
  "gender": "Nam",
  "birth_date": "1990-05-15",
  "phone": "0901234567",
  "contract": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "duration_months": 12
  },
  "deposit_amount": 3000000,
  "room_price": 3000000,
  "stay_days": 30,
  "electricity": {
    "old_index": 100,
    "new_index": 150,
    "staff": "Admin"
  },
  "water_fee": 100000,
  "management_fee": 200000,
  "old_debt": 0,
  "deduction": 0,
  "note": "Khách hàng mới",
  "month": 11,
  "year": 2025
}
```

---

## Response Success (201 Created)

```json
{
  "status": "success",
  "message": "Invoice created successfully",
  "data": {
    "_id": "673invoice001...",
    "room_code": "A101",
    "customer_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "total_amount": 3500000,
    "invoice_status": 1,
    "month": 11,
    "year": 2025,
    "createdAt": "2025-11-14T10:00:00.000Z"
  }
}
```

---

## Auto-calculated Fields

Khi tạo invoice, hệ thống tự động tính:

```javascript
// Electricity
used_kwh = new_index - old_index
electricity_price = used_kwh * 4000  // 4000đ/kWh (mặc định)

// Total
total_amount = actual_room_fee + water_fee + management_fee + electricity_price + old_debt - deduction
remaining_amount = total_amount  // Ban đầu = total (chưa thanh toán)
```

---

## Example Usage (React Form)

```javascript
import { useState } from 'react';
import axios from 'axios';

function CreateInvoiceForm() {
  const [formData, setFormData] = useState({
    room_code: '',
    customer_name: '',
    gender: 'Nam',
    phone: '',
    room_price: 0,
    electricity: {
      old_index: 0,
      new_index: 0,
      staff: ''
    },
    water_fee: 0,
    management_fee: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        'http://localhost:3321/api/v1/invoices',
        formData
      );
      
      alert('Tạo hóa đơn thành công!');
      // Reset form or redirect
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Tạo hóa đơn mới</h2>

      <input
        type="text"
        placeholder="Mã phòng"
        value={formData.room_code}
        onChange={(e) => setFormData({...formData, room_code: e.target.value})}
      />

      <input
        type="text"
        placeholder="Tên khách hàng"
        value={formData.customer_name}
        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
      />

      <input
        type="tel"
        placeholder="Số điện thoại *"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
      />

      <input
        type="number"
        placeholder="Giá phòng"
        value={formData.room_price}
        onChange={(e) => setFormData({...formData, room_price: Number(e.target.value)})}
      />

      <div>
        <label>Điện:</label>
        <input
          type="number"
          placeholder="Chỉ số cũ"
          value={formData.electricity.old_index}
          onChange={(e) => setFormData({
            ...formData,
            electricity: {
              ...formData.electricity,
              old_index: Number(e.target.value)
            }
          })}
        />
        <input
          type="number"
          placeholder="Chỉ số mới"
          value={formData.electricity.new_index}
          onChange={(e) => setFormData({
            ...formData,
            electricity: {
              ...formData.electricity,
              new_index: Number(e.target.value)
            }
          })}
        />
      </div>

      <input
        type="number"
        placeholder="Tiền nước"
        value={formData.water_fee}
        onChange={(e) => setFormData({...formData, water_fee: Number(e.target.value)})}
      />

      <input
        type="number"
        placeholder="Phí quản lý"
        value={formData.management_fee}
        onChange={(e) => setFormData({...formData, management_fee: Number(e.target.value)})}
      />

      <div>
        <label>Tháng/Năm:</label>
        <input
          type="number"
          min="1"
          max="12"
          placeholder="Tháng"
          value={formData.month}
          onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}
        />
        <input
          type="number"
          placeholder="Năm"
          value={formData.year}
          onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo hóa đơn'}
      </button>
    </form>
  );
}
```

---

# 4️⃣ POST /api/v1/invoices/:id/send

Gửi một hóa đơn qua Zalo ZNS.

**⚠️ Note:** Endpoint này yêu cầu Zalo ZNS service được cấu hình. Nếu chưa có, sẽ trả về lỗi.

## Request

```http
POST /api/v1/invoices/:id/send HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Invoice ID |

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Invoice sent successfully",
  "data": {
    "invoiceId": "673invoice001...",
    "zaloRes": {
      "success": true,
      "message": "Sent successfully"
    }
  }
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "error": "Invoice not found"
}
```

### 500 Error - Send Failed
```json
{
  "status": "error",
  "message": "Gửi hóa đơn thất bại",
  "error": "Zalo error message"
}
```

---

## Example Usage

```javascript
const sendInvoice = async (invoiceId) => {
  try {
    const { data } = await axios.post(
      `http://localhost:3321/api/v1/invoices/${invoiceId}/send`
    );
    
    console.log('Invoice sent:', data.data);
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy hóa đơn');
    }
    throw new Error(error.response?.data?.message || 'Gửi thất bại');
  }
};
```

---

# 5️⃣ POST /api/v1/invoices/send-many

Gửi nhiều hóa đơn cùng lúc.

## Request

```http
POST /api/v1/invoices/send-many HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `invoiceIds` | Array[String] | ✅ Yes | Danh sách invoice IDs |

---

## Request Body Example

```json
{
  "invoiceIds": [
    "673invoice001...",
    "673invoice002...",
    "673invoice003..."
  ]
}
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Invoices sent successfully",
  "data": [
    {
      "invoiceId": "673invoice001...",
      "status": 2,
      "message": "Gửi hóa đơn thành công",
      "zaloRes": {
        "success": true
      }
    },
    {
      "invoiceId": "673invoice002...",
      "status": 4,
      "message": "Gửi hóa đơn thất bại: Error message",
      "zaloRes": {
        "success": false
      }
    }
  ]
}
```

---

## Example Usage

```javascript
const sendMultipleInvoices = async (invoiceIds) => {
  try {
    const { data } = await axios.post(
      'http://localhost:3321/api/v1/invoices/send-many',
      { invoiceIds }
    );
    
    const results = data.data;
    const success = results.filter(r => r.status === 2).length;
    const failed = results.filter(r => r.status === 4).length;
    
    console.log(`Sent: ${success} success, ${failed} failed`);
    return results;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Gửi thất bại');
  }
};

// Usage
await sendMultipleInvoices([
  'invoice1_id',
  'invoice2_id',
  'invoice3_id'
]);
```

---

# 6️⃣ GET /api/v1/invoices/report

Lấy báo cáo hóa đơn theo tháng/năm.

## Request

```http
GET /api/v1/invoices/report?month=11&year=2025 HTTP/1.1
Host: localhost:3321
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | Number | ✅ Yes | Tháng (1-12) |
| `year` | Number | ✅ Yes | Năm |

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Report generated successfully",
  "data": [
    {
      "customer_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "room_code": "A101",
      "room_price": 3000000,
      "actual_room_fee": 3000000,
      "electricity_fee": 200000,
      "water_fee": 100000,
      "management_fee": 200000,
      "total_amount": 3500000,
      "amount_paid": 0,
      "remaining_amount": 3500000,
      "invoice_status": 2,
      "invoice_message": "Gửi hóa đơn thành công",
      "latest_send_status": 2,
      "latest_send_message": "Gửi hóa đơn thành công",
      "latest_send_time": "2025-11-14T10:00:00.000Z"
    }
  ]
}
```

---

## Example Usage

```javascript
const getReport = async (month, year) => {
  try {
    const { data } = await axios.get(
      'http://localhost:3321/api/v1/invoices/report',
      {
        params: { month, year }
      }
    );
    
    return data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lỗi lấy báo cáo');
  }
};

// Usage
const report = await getReport(11, 2025);

// Calculate totals
const totalRevenue = report.reduce((sum, inv) => sum + inv.total_amount, 0);
const totalPaid = report.reduce((sum, inv) => sum + inv.amount_paid, 0);
const totalRemaining = report.reduce((sum, inv) => sum + inv.remaining_amount, 0);
```

---

# 7️⃣ POST /api/v1/invoices/sync-file-sheet

Đồng bộ dữ liệu từ Google Sheets.

**⚠️ Note:** Endpoint này yêu cầu Google Sheets API được cấu hình.

## Request

```http
POST /api/v1/invoices/sync-file-sheet HTTP/1.1
Host: localhost:3321
Content-Type: application/json
```

**Body Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spreadsheetId` | String | ✅ Yes | Google Sheets ID |
| `range` | Object | ✅ Yes | Range configuration |
| `range.sheetName` | String | ✅ Yes | Tên sheet (default: "78ds17") |
| `range.startRow` | Number | ✅ Yes | Dòng bắt đầu (default: 15) |
| `range.endRow` | Number | ✅ Yes | Dòng kết thúc (default: 1000) |
| `range.startColumn` | String | ✅ Yes | Cột bắt đầu (default: "A") |
| `range.endColumn` | String | ✅ Yes | Cột kết thúc (default: "AD") |
| `month` | Number | ⚪ Optional | Tháng (default: current month) |
| `year` | Number | ⚪ Optional | Năm (default: current year) |

---

## Request Body Example

```json
{
  "spreadsheetId": "1abc123def456...",
  "range": {
    "sheetName": "78ds17",
    "startRow": 15,
    "endRow": 1000,
    "startColumn": "A",
    "endColumn": "AD"
  },
  "month": 11,
  "year": 2025
}
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Data synchronized successfully"
}
```

---

## Example Usage

```javascript
const syncFromSheet = async (spreadsheetId, range, month, year) => {
  try {
    const { data } = await axios.post(
      'http://localhost:3321/api/v1/invoices/sync-file-sheet',
      {
        spreadsheetId,
        range,
        month,
        year
      }
    );
    
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Đồng bộ thất bại');
  }
};
```

---

# 🔧 React Integration Examples

## Complete Service Layer

```javascript
// services/invoiceService.js
import axios from 'axios';

const API_BASE = 'http://localhost:3321/api/v1';

export const invoiceService = {
  // List invoices
  getAll: async (options = {}) => {
    const { data } = await axios.get(`${API_BASE}/invoices`, {
      params: {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc',
        ...(options.search && { search: options.search })
      }
    });
    return {
      invoices: data.data.rows,
      total: data.data.total
    };
  },

  // Get by ID
  getById: async (id) => {
    const { data } = await axios.get(`${API_BASE}/invoices/${id}`);
    return data.data;
  },

  // Create
  create: async (invoiceData) => {
    const { data } = await axios.post(`${API_BASE}/invoices`, invoiceData);
    return data.data;
  },

  // Send single
  send: async (id) => {
    const { data } = await axios.post(`${API_BASE}/invoices/${id}/send`);
    return data.data;
  },

  // Send multiple
  sendMany: async (invoiceIds) => {
    const { data } = await axios.post(
      `${API_BASE}/invoices/send-many`,
      { invoiceIds }
    );
    return data.data;
  },

  // Get report
  getReport: async (month, year) => {
    const { data } = await axios.get(`${API_BASE}/invoices/report`, {
      params: { month, year }
    });
    return data.data;
  },

  // Sync from sheet
  syncFromSheet: async (spreadsheetId, range, month, year) => {
    const { data } = await axios.post(
      `${API_BASE}/invoices/sync-file-sheet`,
      { spreadsheetId, range, month, year }
    );
    return data;
  }
};
```

---

## Complete Invoice Management Component

```javascript
import { useState, useEffect } from 'react';
import { invoiceService } from '../services';

function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  useEffect(() => {
    loadInvoices();
  }, [pagination.page, pagination.limit, filters]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const result = await invoiceService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      setInvoices(result.invoices);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      alert('Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (invoiceId) => {
    if (!window.confirm('Gửi hóa đơn này?')) return;

    try {
      await invoiceService.send(invoiceId);
      alert('Gửi thành công!');
      loadInvoices();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const handleSendMany = async () => {
    if (selectedInvoices.length === 0) {
      alert('Chọn ít nhất 1 hóa đơn');
      return;
    }

    if (!window.confirm(`Gửi ${selectedInvoices.length} hóa đơn?`)) return;

    try {
      const results = await invoiceService.sendMany(selectedInvoices);
      const success = results.filter(r => r.status === 2).length;
      alert(`Gửi thành công ${success}/${results.length} hóa đơn`);
      setSelectedInvoices([]);
      loadInvoices();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  const toggleSelect = (invoiceId) => {
    setSelectedInvoices(prev =>
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  return (
    <div className="invoice-management">
      <h1>Quản lý Hóa đơn</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
        >
          <option value="createdAt">Ngày tạo</option>
          <option value="total_amount">Tổng tiền</option>
        </select>
      </div>

      {/* Actions */}
      {selectedInvoices.length > 0 && (
        <div className="bulk-actions">
          <button onClick={handleSendMany}>
            Gửi {selectedInvoices.length} hóa đơn
          </button>
        </div>
      )}

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedInvoices.length === invoices.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedInvoices(invoices.map(i => i._id));
                  } else {
                    setSelectedInvoices([]);
                  }
                }}
              />
            </th>
            <th>Mã phòng</th>
            <th>Khách hàng</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Tháng/Năm</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => (
            <tr key={invoice._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedInvoices.includes(invoice._id)}
                  onChange={() => toggleSelect(invoice._id)}
                />
              </td>
              <td>{invoice.room_code}</td>
              <td>{invoice.customer_name}</td>
              <td>{invoice.total_amount?.toLocaleString()}đ</td>
              <td>
                <span className={`status status-${invoice.invoice_status}`}>
                  {getStatusLabel(invoice.invoice_status)}
                </span>
              </td>
              <td>{invoice.month}/{invoice.year}</td>
              <td>
                <button onClick={() => handleSend(invoice._id)}>
                  Gửi
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPagination({...pagination, page: pagination.page - 1})}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
        </span>
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

function getStatusLabel(status) {
  const labels = {
    1: 'Chưa gửi',
    2: 'Đã gửi',
    3: 'Đã thanh toán',
    4: 'Thất bại'
  };
  return labels[status] || 'Unknown';
}
```

---

# 🎯 Use Cases & Scenarios

## Use Case 1: Monthly Invoice Generation

```javascript
const generateMonthlyInvoices = async (month, year, customers) => {
  const results = {
    success: [],
    failed: []
  };

  for (const customer of customers) {
    try {
      const invoice = await invoiceService.create({
        room_code: customer.room_code,
        customer_name: customer.name,
        phone: customer.phone,
        room_price: customer.room_price,
        electricity: {
          old_index: customer.electricity_old,
          new_index: customer.electricity_new,
          staff: 'System'
        },
        water_fee: customer.water_fee,
        management_fee: customer.management_fee,
        month,
        year
      });
      results.success.push(invoice);
    } catch (error) {
      results.failed.push({ customer, error: error.message });
    }
  }

  return results;
};
```

---

## Use Case 2: Invoice Status Dashboard

```javascript
const getInvoiceStats = async (month, year) => {
  const report = await invoiceService.getReport(month, year);
  
  const stats = {
    total: report.length,
    total_amount: report.reduce((sum, inv) => sum + inv.total_amount, 0),
    total_paid: report.reduce((sum, inv) => sum + inv.amount_paid, 0),
    total_remaining: report.reduce((sum, inv) => sum + inv.remaining_amount, 0),
    by_status: {
      pending: report.filter(inv => inv.invoice_status === 1).length,
      sent: report.filter(inv => inv.invoice_status === 2).length,
      paid: report.filter(inv => inv.invoice_status === 3).length,
      failed: report.filter(inv => inv.invoice_status === 4).length
    }
  };

  return stats;
};
```

---

## Use Case 3: Bulk Send with Retry

```javascript
const sendInvoicesWithRetry = async (invoiceIds, maxRetries = 3) => {
  const results = [];
  
  for (const invoiceId of invoiceIds) {
    let retries = 0;
    let success = false;
    
    while (retries < maxRetries && !success) {
      try {
        await invoiceService.send(invoiceId);
        results.push({ invoiceId, success: true, retries });
        success = true;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          results.push({ invoiceId, success: false, error: error.message });
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
  }
  
  return results;
};
```

---

# ⚠️ Important Notes

## 1. Auto-calculation

Khi tạo invoice, hệ thống tự động tính:
- `used_kwh = new_index - old_index`
- `electricity.price = used_kwh * 4000` (mặc định 4000đ/kWh)
- `total_amount = room_fee + water_fee + management_fee + electricity_price + old_debt - deduction`

## 2. Invoice Status Flow

```
1 (Pending) → 2 (Sent) → 3 (Paid)
              ↓
            4 (Failed)
```

## 3. Zalo Integration

- Gửi hóa đơn qua Zalo ZNS template ID: `420761`
- Phone number được format: `0xxx` → `84xxx`
- Tracking ID: `invoice_{invoice_id}`

## 4. Best Practices

### ✅ DO:
- Validate phone number trước khi tạo
- Check electricity indexes hợp lý (new > old)
- Set month/year đúng
- Handle errors gracefully
- Show loading state khi gửi

### ❌ DON'T:
- Gửi invoice nhiều lần (check status trước)
- Hardcode electricity price
- Skip validation
- Ignore failed sends

---

# 🆘 Troubleshooting

## Issue 1: "Invoice not found"
**Solution:** Verify invoice ID exists

## Issue 2: Zalo send failed
**Solution:** Check Zalo service configuration

## Issue 3: Auto-calculation wrong
**Solution:** Verify electricity indexes

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0  
**Status:** Production Ready


