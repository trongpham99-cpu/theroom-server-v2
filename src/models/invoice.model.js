const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    room_code: { type: String },
    apartment_code: { type: String },

    /** Customer Info */
    customer_name: { type: String },
    gender: {
        type: String,
        enum: ['Nam', 'Nữ', 'N/A'],
        default: 'Nam',
    },
    birth_date: { type: Date },
    phone: { type: String, required: true },

    /** Hợp đồng */
    contract: {
        start_date: { type: Date }, // ngày vào
        end_date: { type: Date },   // ngày hết hạn
        duration_months: { type: Number }, // kỳ hạn HD
    },

    /** Tiền cọc */
    deposit_amount: { type: Number },

    /** Tiền thuê */
    room_price: { type: Number },
    stay_days: { type: Number },
    actual_room_fee: { type: Number },

    /** Điện */
    electricity: {
        old_index: { type: Number },
        new_index: { type: Number },
        used_kwh: { type: Number },
        price: { type: Number },
        staff: { type: String }, // nếu muốn sau này ghi ai ghi điện
    },

    /** Nước và phí quản lý */
    water_usage: { type: Number, default: 1 }, // số người dùng nước
    water_fee: { type: Number },
    management_fee: { type: Number },

    /** Các khoản khác */
    old_debt: { type: Number },
    deduction: { type: Number },
    total_amount: { type: Number },
    amount_paid: { type: Number },
    remaining_amount: { type: Number },

    /** Ghi chú */
    note: { type: String },
    extra_note: { type: String },

    /** Trạng thái hóa đơn */
    invoice_status: {
        type: Number,
        enum: [1, 2, 3, 4], // 1: pending, 2: sent, 3: paid, 4: failed
        default: 1,
    },
    invoice_message: { type: String, default: null },

    /** Kỳ hóa đơn */
    month: { type: Number },
    year: { type: Number },

    /** Lịch sử */
    history: [
        {
            status: { type: Number },
            message: { type: String },
            created_at: { type: Date, default: Date.now },
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
