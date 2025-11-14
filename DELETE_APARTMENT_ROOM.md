# Delete Apartment & Room API Guide

## 📌 Delete Endpoints

DELETE APIs để xóa Apartment và Room với data integrity protection.

**Base URL:** `http://localhost:3321/api/v1`

---

# 🗑️ DELETE /api/v1/apartments/:id

Xóa tòa nhà (apartment) theo ID.

**⚠️ Important:** Không thể xóa apartment nếu còn rooms bên trong. Phải xóa hết rooms trước.

## Request

```http
DELETE /api/v1/apartments/:id HTTP/1.1
Host: localhost:3321
```

**Headers:** Không cần authentication

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Apartment ID (MongoDB ObjectId) |

---

## Request Example

```http
DELETE /api/v1/apartments/6917240b2a735dabeafda00e HTTP/1.1
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Apartment deleted successfully",
  "data": {
    "deleted_id": "6917240b2a735dabeafda00e",
    "deleted_code": "Building C"
  }
}
```

---

## Error Responses

### 404 Not Found - Apartment Not Exists
```json
{
  "status": "fail",
  "message": "Apartment not found"
}
```

### 400 Bad Request - Has Rooms
```json
{
  "status": "fail",
  "message": "Cannot delete apartment. It has 5 room(s). Please delete rooms first."
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Example Usage (JavaScript/Fetch)

```javascript
const deleteApartment = async (apartmentId) => {
  try {
    const response = await fetch(
      `http://localhost:3321/api/v1/apartments/${apartmentId}`,
      { method: 'DELETE' }
    );

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Apartment deleted:', data.data.deleted_code);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error deleting apartment:', error);
    throw error;
  }
};

// Usage
await deleteApartment('6917240b2a735dabeafda00e');
```

---

## Example Usage (Axios)

```javascript
import axios from 'axios';

const deleteApartment = async (apartmentId) => {
  try {
    const { data } = await axios.delete(
      `http://localhost:3321/api/v1/apartments/${apartmentId}`
    );
    
    console.log('Deleted:', data.data.deleted_code);
    return true;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};
```

---

## Example Usage (React Hook)

```javascript
import { useState } from 'react';
import axios from 'axios';

const useDeleteApartment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteApartment = async (apartmentId) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.delete(
        `http://localhost:3321/api/v1/apartments/${apartmentId}`
      );
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { deleteApartment, loading, error };
};

// Usage in component
function ApartmentList({ apartments, onDelete }) {
  const { deleteApartment, loading, error } = useDeleteApartment();

  const handleDelete = async (apartment) => {
    if (!window.confirm(`Xóa tòa nhà "${apartment.code}"?`)) {
      return;
    }

    try {
      await deleteApartment(apartment._id);
      alert('Xóa thành công!');
      onDelete(apartment._id); // Update UI
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  return (
    <div>
      {apartments.map(apt => (
        <div key={apt._id}>
          <span>{apt.code}</span>
          <button 
            onClick={() => handleDelete(apt)}
            disabled={loading}
          >
            🗑️ Xóa
          </button>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

# 🗑️ DELETE /api/v1/rooms/:id

Xóa phòng (room) theo ID.

**⚠️ Important:** Không thể xóa room nếu còn customers. Phải xóa/chuyển customers trước.

## Request

```http
DELETE /api/v1/rooms/:id HTTP/1.1
Host: localhost:3321
```

**Headers:** Không cần authentication

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | String | ✅ Yes | Room ID (MongoDB ObjectId) |

---

## Request Example

```http
DELETE /api/v1/rooms/691724132a735dabeafda012 HTTP/1.1
```

---

## Response Success (200 OK)

```json
{
  "status": "success",
  "message": "Room deleted successfully",
  "data": {
    "deleted_id": "691724132a735dabeafda012",
    "deleted_code": "C101"
  }
}
```

---

## Error Responses

### 404 Not Found - Room Not Exists
```json
{
  "status": "fail",
  "message": "Room not found"
}
```

### 400 Bad Request - Has Customers
```json
{
  "status": "fail",
  "message": "Cannot delete room. It has 3 customer(s). Please remove customers first."
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "error": "Error details..."
}
```

---

## Example Usage (JavaScript/Fetch)

```javascript
const deleteRoom = async (roomId) => {
  try {
    const response = await fetch(
      `http://localhost:3321/api/v1/rooms/${roomId}`,
      { method: 'DELETE' }
    );

    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('Room deleted:', data.data.deleted_code);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

// Usage
await deleteRoom('691724132a735dabeafda012');
```

---

## Example Usage (Axios)

```javascript
import axios from 'axios';

const deleteRoom = async (roomId) => {
  try {
    const { data } = await axios.delete(
      `http://localhost:3321/api/v1/rooms/${roomId}`
    );
    
    console.log('Deleted:', data.data.deleted_code);
    return true;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};
```

---

## Example Usage (React Hook)

```javascript
import { useState } from 'react';
import axios from 'axios';

const useDeleteRoom = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteRoom = async (roomId) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.delete(
        `http://localhost:3321/api/v1/rooms/${roomId}`
      );
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { deleteRoom, loading, error };
};

// Usage in component
function RoomList({ rooms, onDelete }) {
  const { deleteRoom, loading, error } = useDeleteRoom();

  const handleDelete = async (room) => {
    if (!window.confirm(`Xóa phòng "${room.code}"?`)) {
      return;
    }

    try {
      await deleteRoom(room._id);
      alert('Xóa thành công!');
      onDelete(room._id); // Update UI
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  return (
    <div>
      {rooms.map(room => (
        <div key={room._id}>
          <span>{room.code}</span>
          <button 
            onClick={() => handleDelete(room)}
            disabled={loading}
          >
            🗑️ Xóa
          </button>
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

# 🔧 Complete Integration Example

## Full CRUD Manager Component

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3321/api/v1';

function ApartmentRoomCRUD() {
  const [apartments, setApartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apartmentsRes, roomsRes] = await Promise.all([
        axios.get(`${API_BASE}/apartments`),
        axios.get(`${API_BASE}/rooms`),
      ]);
      setApartments(apartmentsRes.data.data.rows);
      setRooms(roomsRes.data.data.rows);
    } catch (error) {
      alert('Lỗi load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete apartment
  const handleDeleteApartment = async (apartment) => {
    if (!window.confirm(`Xóa tòa nhà "${apartment.code}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/apartments/${apartment._id}`);
      setApartments(apartments.filter(a => a._id !== apartment._id));
      alert('Xóa tòa nhà thành công!');
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      alert('Lỗi: ' + message);
    } finally {
      setLoading(false);
    }
  };

  // Delete room
  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Xóa phòng "${room.code}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/rooms/${room._id}`);
      setRooms(rooms.filter(r => r._id !== room._id));
      alert('Xóa phòng thành công!');
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      alert('Lỗi: ' + message);
    } finally {
      setLoading(false);
    }
  };

  // Filter rooms by selected apartment
  const filteredRooms = selectedApartmentId
    ? rooms.filter(r => r.apartment_id === selectedApartmentId)
    : rooms;

  return (
    <div className="crud-manager">
      <h1>Quản lý Tòa nhà & Phòng</h1>

      {loading && <div className="loading">Đang xử lý...</div>}

      {/* Apartments List */}
      <section>
        <h2>Tòa nhà ({apartments.length})</h2>
        <div className="list">
          {apartments.map(apt => {
            const roomCount = rooms.filter(r => r.apartment_id === apt._id).length;
            return (
              <div key={apt._id} className="item">
                <span className="name">{apt.code}</span>
                <span className="badge">{roomCount} phòng</span>
                <button
                  onClick={() => setSelectedApartmentId(apt._id)}
                  className="btn-view"
                >
                  👁️ Xem
                </button>
                <button
                  onClick={() => handleDeleteApartment(apt)}
                  className="btn-delete"
                  disabled={loading || roomCount > 0}
                  title={roomCount > 0 ? 'Phải xóa hết phòng trước' : 'Xóa'}
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Rooms List */}
      <section>
        <h2>
          Phòng ({filteredRooms.length})
          {selectedApartmentId && (
            <>
              {' - '}
              {apartments.find(a => a._id === selectedApartmentId)?.code}
              <button onClick={() => setSelectedApartmentId('')}>
                Xem tất cả
              </button>
            </>
          )}
        </h2>
        <div className="list">
          {filteredRooms.map(room => (
            <div key={room._id} className="item">
              <span className="name">{room.code}</span>
              <button
                onClick={() => handleDeleteRoom(room)}
                className="btn-delete"
                disabled={loading}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ApartmentRoomCRUD;
```

---

# ⚠️ Important Notes

## 1. Data Integrity Protection

### Apartment Delete:
- ❌ **Không thể xóa** nếu còn rooms
- ✅ **Phải xóa hết rooms trước**
- 💡 **Lý do:** Tránh orphan rooms (rooms không thuộc apartment nào)

### Room Delete:
- ❌ **Không thể xóa** nếu còn customers
- ✅ **Phải xóa/chuyển customers trước**
- 💡 **Lý do:** Tránh orphan customers (customers không thuộc room nào)

---

## 2. Delete Flow

### Để xóa Apartment:
```
1. List rooms trong apartment
2. Delete từng room (hoặc reassign customers)
3. Delete apartment
```

### Để xóa Room:
```
1. Check customers trong room
2. Remove/reassign customers
3. Delete room
```

---

## 3. Response Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Xóa thành công |
| 400 | Bad Request | Có rooms/customers (không thể xóa) |
| 404 | Not Found | Apartment/Room không tồn tại |
| 500 | Internal Server Error | Lỗi server |

---

## 4. Best Practices

### ✅ DO:
- Confirm trước khi xóa (confirmation dialog)
- Show số lượng rooms/customers trước khi xóa
- Disable delete button nếu có dependencies
- Handle errors gracefully
- Update UI ngay sau khi delete thành công
- Show clear error messages

### ❌ DON'T:
- Delete without confirmation
- Allow delete when has dependencies
- Ignore error responses
- Forget to update UI after delete
- Show technical error messages to users

---

## 5. Error Handling

```javascript
const handleDeleteWithErrorHandling = async (deleteFn, id, name) => {
  // Confirmation
  if (!window.confirm(`Bạn chắc chắn muốn xóa "${name}"?`)) {
    return;
  }

  try {
    await deleteFn(id);
    return { success: true };
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    
    // User-friendly messages
    let userMessage = 'Không thể xóa. Vui lòng thử lại!';
    
    if (message.includes('has') && message.includes('room')) {
      userMessage = 'Không thể xóa tòa nhà. Vui lòng xóa hết phòng trước!';
    } else if (message.includes('has') && message.includes('customer')) {
      userMessage = 'Không thể xóa phòng. Vui lòng xóa hết khách hàng trước!';
    } else if (message.includes('not found')) {
      userMessage = 'Không tìm thấy. Có thể đã bị xóa rồi!';
    }
    
    return { success: false, error: userMessage };
  }
};

// Usage
const result = await handleDeleteWithErrorHandling(
  deleteApartment,
  apartment._id,
  apartment.code
);

if (!result.success) {
  alert(result.error);
}
```

---

# 🎯 Use Cases

## Use Case 1: Bulk Delete Rooms Before Apartment

```javascript
const deleteApartmentWithRooms = async (apartmentId) => {
  try {
    // Step 1: Get all rooms in apartment
    const { data } = await axios.get(`http://localhost:3321/api/v1/rooms`);
    const roomsInApartment = data.data.rows.filter(
      r => r.apartment_id === apartmentId
    );

    if (roomsInApartment.length === 0) {
      // No rooms, delete apartment directly
      await axios.delete(`http://localhost:3321/api/v1/apartments/${apartmentId}`);
      console.log('Apartment deleted');
      return;
    }

    // Step 2: Confirm bulk delete
    if (!window.confirm(
      `Tòa nhà có ${roomsInApartment.length} phòng. Xóa tất cả?`
    )) {
      return;
    }

    // Step 3: Delete all rooms
    for (const room of roomsInApartment) {
      try {
        await axios.delete(`http://localhost:3321/api/v1/rooms/${room._id}`);
        console.log(`Deleted room ${room.code}`);
      } catch (error) {
        console.error(`Failed to delete room ${room.code}:`, error.message);
        throw new Error(`Cannot delete room ${room.code}. It may have customers.`);
      }
    }

    // Step 4: Delete apartment
    await axios.delete(`http://localhost:3321/api/v1/apartments/${apartmentId}`);
    console.log('All done!');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## Use Case 2: Safe Delete with Undo

```javascript
const useSafeDelete = () => {
  const [deletedItems, setDeletedItems] = useState([]);

  const safeDelete = async (type, id) => {
    try {
      // Store for undo
      const endpoint = type === 'apartment' ? 'apartments' : 'rooms';
      const { data: item } = await axios.get(
        `http://localhost:3321/api/v1/${endpoint}/${id}`
      );

      // Delete
      await axios.delete(`http://localhost:3321/api/v1/${endpoint}/${id}`);

      // Store for undo (within 10 seconds)
      setDeletedItems(prev => [...prev, { type, item, timestamp: Date.now() }]);
      
      // Auto-clear after 10 seconds
      setTimeout(() => {
        setDeletedItems(prev => prev.filter(d => d.item._id !== id));
      }, 10000);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const undo = async (deletedItem) => {
    // Re-create the deleted item
    const endpoint = deletedItem.type === 'apartment' ? 'apartments' : 'rooms';
    await axios.post(`http://localhost:3321/api/v1/${endpoint}`, {
      code: deletedItem.item.code,
      ...(deletedItem.type === 'room' && {
        apartment_id: deletedItem.item.apartment_id
      })
    });

    // Remove from deleted list
    setDeletedItems(prev => prev.filter(d => d !== deletedItem));
  };

  return { safeDelete, undo, deletedItems };
};
```

---

# 🆘 Troubleshooting

## Issue 1: "Cannot delete apartment. It has X room(s)"
**Cause:** Apartment còn rooms  
**Solution:**
1. List tất cả rooms của apartment
2. Delete từng room (hoặc reassign)
3. Sau đó mới delete apartment

```javascript
// Get rooms in apartment
const rooms = allRooms.filter(r => r.apartment_id === apartmentId);
console.log(`Need to delete ${rooms.length} rooms first`);
```

---

## Issue 2: "Cannot delete room. It has X customer(s)"
**Cause:** Room còn customers  
**Solution:**
1. Remove hoặc reassign customers
2. Sau đó mới delete room

**Note:** Hiện tại API chưa có endpoint delete customer. Cần implement sau.

---

## Issue 3: "Room/Apartment not found"
**Cause:** ID không hợp lệ hoặc đã bị xóa  
**Solution:**
- Verify ID có đúng format ObjectId
- Check item còn tồn tại: GET /apartments hoặc GET /rooms
- Có thể đã bị xóa rồi (idempotent - OK)

---

# 📝 Summary

## Endpoints Created:

| Method | Endpoint | Purpose | Protection |
|--------|----------|---------|------------|
| DELETE | `/api/v1/apartments/:id` | Xóa apartment | ✅ Check rooms |
| DELETE | `/api/v1/rooms/:id` | Xóa room | ✅ Check customers |

## Features:
- ✅ Cascade delete protection
- ✅ Foreign key validation
- ✅ Clear error messages
- ✅ Returns deleted info
- ✅ 404 handling

## Still Need:
- ⏭️ Customer DELETE endpoint
- ⏭️ Soft delete (mark as deleted)
- ⏭️ Cascade delete option (force delete with children)
- ⏭️ Batch delete

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0  
**Status:** Production Ready

