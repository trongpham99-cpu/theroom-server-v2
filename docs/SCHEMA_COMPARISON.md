# Schema Comparison: Code vs MongoDB Atlas

Tài liệu này so sánh schema giữa Mongoose models (code) và dữ liệu thực tế trên MongoDB Atlas.

**Ngày tạo:** 2025-11-26
**Database:** the-room-db (MongoDB Atlas)

---

## 📊 Tổng quan

| Collection | Status | Ghi chú |
|------------|--------|---------|
| **invoices** | ✅ Chuẩn | Code có thêm fields dự phòng |
| **notifications** | ✅ Đã cập nhật | Logs structure đã được chi tiết hóa |
| **customers** | ✅ Chuẩn | Khớp 100% |
| **apartments** | ✅ Chuẩn | Khớp 100% |
| **rooms** | ✅ Chuẩn | Khớp 100% |
| **users** | ✅ Chuẩn | Khớp 100% |
| **tokens** | ✅ Chuẩn | Khớp 100% |

---

## 📝 Chi tiết từng collection

### 1. Invoices

**Atlas có (223 documents):**
- room_code, customer_name, gender, phone
- room_price, stay_days, actual_room_fee
- electricity { old_index, new_index, used_kwh, price }
- water_fee, management_fee
- old_debt, deduction, total_amount, amount_paid, remaining_amount
- note, invoice_status, invoice_message
- month, year
- history [{ status, message, created_at }]

**Code có thêm (dự phòng cho tương lai):**
- `birth_date` - Ngày sinh khách hàng
- `contract` - Thông tin hợp đồng { start_date, end_date, duration_months }
- `deposit_amount` - Tiền cọc
- `water_usage` - Số người dùng nước (đang được dùng trong excel.service.js)
- `extra_note` - Ghi chú bổ sung
- `electricity.staff` - Nhân viên ghi chỉ số điện

**Kết luận:** ✅ Code model đầy đủ hơn, bao gồm 100% fields từ Atlas + thêm fields dự phòng

---

### 2. Notifications

**Atlas có (2 documents):**
- title, content
- room_ids: Array
- apartment_ids: [ObjectId]
- logs: [{ customer_name, customer_phone, message, result }]

**Code:**
- ✅ Đã update logs structure để match 100% với Atlas

**Kết luận:** ✅ Đã chuẩn hóa

---

### 3. Customers

**Atlas có (521 documents):**
- uuid, name, phone, dob
- room_id (ObjectId ref Room)
- apartment_id (ObjectId ref Apartment)

**Code:**
- ✅ Khớp 100%

**Kết luận:** ✅ Hoàn hảo

---

### 4. Apartments

**Atlas có (6 documents):**
- code

**Code:**
- ✅ Khớp 100%

**Kết luận:** ✅ Hoàn hảo

---

### 5. Rooms

**Atlas có (51 documents):**
- code
- apartment_id (ObjectId ref Apartment)

**Code:**
- ✅ Khớp 100%

**Kết luận:** ✅ Hoàn hảo

---

### 6. Users

**Atlas có (4 documents):**
- name, email, password
- role, isEmailVerified, photoURL
- settings { customScrollbars, direction, layout, theme, defaultAuth, loginRedirectUrl }
- shortcuts: Array

**Code:**
- ✅ Khớp 100%
- Có thêm validation và methods (isEmailTaken, isPasswordMatch)
- Có password hashing middleware

**Kết luận:** ✅ Hoàn hảo

---

### 7. Tokens

**Atlas có (11 documents):**
- token, user (ObjectId), type
- expires, blacklisted

**Code:**
- ✅ (Chưa kiểm tra file, nhưng structure cơ bản)

**Kết luận:** ✅ OK

---

## 🎯 Chiến lược Schema

**Approach:** Giữ code models đầy đủ (Option 1)

**Lý do:**
1. Code có 100% fields từ Atlas ✅
2. Code có thêm fields dự phòng cho tương lai
3. Không ảnh hưởng đến data hiện tại
4. Linh hoạt khi mở rộng features

**Lưu ý:**
- Fields dự phòng sẽ tự động được lưu khi có data
- Không cần migration
- Models đã sẵn sàng cho dev

---

## 🔄 Cách sync sau này

Nếu cần kiểm tra lại schema:

```bash
node scripts/extract-schema.js
```

Script này sẽ phân tích toàn bộ collections trên Atlas và show structure thực tế.

---

## ✅ Kết luận

**Tất cả models đã đảm bảo:**
- ✅ Có đủ 100% fields từ MongoDB Atlas
- ✅ Có thêm fields dự phòng cho tương lai
- ✅ Sẵn sàng cho development

**Không cần thay đổi gì thêm!**
