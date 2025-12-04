const Invoice = require('../models/invoice.model');
const { fetchSheetData } = require('../services/excel.service');
//const { sendZNS } = require('../services/zalo.service');

//const redisClient = require('../configs/redis');

exports.listInvoices = async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortOrder, search, month, year, excludeRecent, apartmentId } = req.query;

    let query = {};

    // Filter by apartment if provided
    if (apartmentId) {
        query.apartment_code = apartmentId;
    }

    // Filter by month and year if provided
    if (month && year) {
        query.month = parseInt(month, 10);
        query.year = parseInt(year, 10);
    }

    // Exclude current month and last month if excludeRecent is true
    if (excludeRecent === 'true') {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Calculate last month
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth() + 1;
        const lastYear = lastMonthDate.getFullYear();

        // Exclude current and last month
        query.$and = [
            {
                $or: [
                    { year: { $lt: lastYear } },
                    {
                        year: lastYear,
                        month: { $lt: lastMonth }
                    }
                ]
            }
        ];
    }

    if (search) {
        const regex = new RegExp(search, 'i');
        if (!query.$and) {
            query.$and = [];
        }
        query.$and.push({
            $or: [
                { customer_name: regex },
                { phone: regex },
                { room_code: regex },
            ]
        });
    }

    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
        sort.createdAt = -1;
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort,
    };

    const invoices = await Invoice.find(query).
        sort(sort).
        skip((options.page - 1) * options.limit).
        limit(options.limit)
    const countDocuments = await Invoice.countDocuments(query);

    return res.status(200).json({
        status: 'success',
        message: 'Invoices retrieved successfully',
        data: {
            rows: invoices,
            total: countDocuments,
        }
    });
};

exports.getInvoice = async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.status(200).json({
        status: 'success',
        message: 'Invoice retrieved successfully',
        data: invoice,
    });
};

exports.createInvoice = async (req, res) => {
    try {
        const {
            room_code,
            apartment_code,
            customer_name,
            gender = 'Nam',
            birth_date,
            phone,
            contract = {},
            deposit_amount = 0,
            room_price = 0,
            stay_days = 30,
            electricity = {},
            water_fee = 0,
            management_fee = 0,
            old_debt = 0,
            deduction = 0,
            note = '',
            extra_note = '',
            month,
            year,
        } = req.body;

        const old_index = electricity.old_index || 0;
        const new_index = electricity.new_index || 0;
        const used_kwh = new_index - old_index;
        const electricity_price = used_kwh * 4000; // mặc định đơn giá 4000đ/kWh

        const actual_room_fee = room_price; // Bạn có thể điều chỉnh nếu có logic khuyến mãi
        const total_amount = actual_room_fee + water_fee + management_fee + electricity_price + old_debt - deduction;
        const remaining_amount = total_amount; // ban đầu = tổng vì chưa thanh toán

        const invoice = await Invoice.create({
            room_code,
            apartment_code,
            customer_name,
            gender,
            birth_date,
            phone,
            contract: {
                start_date: contract.start_date,
                end_date: contract.end_date,
                duration_months: contract.duration_months,
            },
            deposit_amount,
            room_price,
            stay_days,
            actual_room_fee,
            electricity: {
                old_index,
                new_index,
                used_kwh,
                price: electricity_price,
                staff: electricity.staff || null,
            },
            water_fee,
            management_fee,
            old_debt,
            deduction,
            total_amount,
            amount_paid: 0,
            remaining_amount,
            note,
            extra_note,
            invoice_status: 1, // pending
            history: [],
            invoice_message: null,
            month,
            year,
        });

        return res.status(201).json({
            status: 'success',
            message: 'Invoice created successfully',
            data: invoice,
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Tạo hóa đơn thất bại',
            error: error.message,
        });
    }
};

exports.sendOne = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const templateId = '420761';

        const templateData = {
            transfer_amount: invoice.total_amount,
            bank_transfer_note: `${invoice.room_code} ${invoice.month} ${invoice.year}`,
            typeInvoice: 'Hóa đơn',
            billingMonth: `${invoice.month}/${invoice.year}`,
            tenantName: invoice.customer_name,
            roomCode: invoice.room_code,
            rentPrice: `${invoice.room_price.toLocaleString()}đ`,
            electricityCost: `${invoice.electricity.new_index} - ${invoice.electricity.old_index} = ${invoice.electricity.used_kwh} * 4000 = ${invoice.electricity.price.toLocaleString()}đ`,
            waterCost: `${invoice.water_fee.toLocaleString()}đ`,
            serviceFee: `${invoice.management_fee.toLocaleString()}đ`,
            oldDebt: `${invoice.old_debt.toLocaleString()}đ`,
            deductions: `${invoice.deduction.toLocaleString()}đ`,
            totalCost: `${invoice.total_amount.toLocaleString()}đ`,
            invoiceNote: 'Vui lòng chuyển đúng nội dung và thanh toán vào ngày 01, hạn cuối là ngày 05. Xin cảm ơn quý khách!',
        };

        let newPhone = invoice.phone;
        if (newPhone.startsWith('0')) {
            newPhone = `84${newPhone.slice(1)}`;
        }

        const trackingId = `invoice_${invoice._id}`;
        await redisClient.setEx(trackingId, 3600, newPhone); // Lưu số điện thoại trong Redis với thời gian hết hạn 1 giờ

        const zaloRes = await sendZNS(newPhone, templateId, templateData, trackingId);
        const objectData = {
            message: 'ZNS response',
            zaloRes,
            phone: newPhone,
            templateId,
            templateData,
            trackingId,
        };
        console.log({
            data: JSON.stringify(objectData, null, 2)
        });
        if (!zaloRes.success) {
            invoice.invoice_status = 4;

            invoice.history.push({
                status: 4,
                message: `Gửi hóa đơn thất bại: ${zaloRes.message}`,
            });
            invoice.invoice_message = zaloRes.message;

            await invoice.save();

            return res.status(500).json({
                status: 'error',
                message: 'Gửi hóa đơn thất bại',
                error: zaloRes.message,
            });
        }

        invoice.invoice_status = 2;

        invoice.history.push({
            status: 2,
            message: `Gửi hóa đơn thành công: ${zaloRes.message}`,
        });

        invoice.invoice_message = zaloRes.message;
        await invoice.save();

        return res.status(200).json({
            status: 'success',
            message: 'Invoice sent successfully',
            data: { invoiceId: invoice._id, zaloRes },
        });

    } catch (error) {
        console.error('Send invoice ZNS error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi hệ thống khi gửi hóa đơn',
            error: error.message,
        });
    }
};

exports.sendMany = async (req, res) => {
    const { invoiceIds } = req.body;

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({ error: 'Invalid invoice IDs' });
    }

    try {
        const invoices = await Invoice.find({ _id: { $in: invoiceIds } });

        if (invoices.length === 0) {
            return res.status(404).json({ error: 'No invoices found for the provided IDs' });
        }

        const results = [];
        for (const invoice of invoices) {
            const templateId = '420761';
            const templateData = {
                transfer_amount: invoice.total_amount,
                bank_transfer_note: `${invoice.month} ${invoice.year} ${invoice.room_code}`,
                typeInvoice: 'Hóa đơn',
                billingMonth: `${invoice.month}/${invoice.year}`,
                tenantName: invoice.customer_name,
                roomCode: invoice.room_code,
                rentPrice: `${invoice.room_price.toLocaleString()}đ`,
                electricityCost: `${invoice.electricity.old_index} - ${invoice.electricity.new_index} = ${invoice.electricity.used_kwh} * 4000 = ${invoice.electricity.price.toLocaleString()}đ`,
                waterCost: `${invoice.water_fee.toLocaleString()}đ`,
                serviceFee: `${invoice.management_fee.toLocaleString()}đ`,
                oldDebt: `${invoice.old_debt.toLocaleString()}đ`,
                deductions: `${invoice.deduction.toLocaleString()}đ`,
                totalCost: `${invoice.total_amount.toLocaleString()}đ`,
                invoiceNote: 'Vui lòng chuyển đúng nội dung và thanh toán vào ngày 01, hạn cuối là ngày 05. Xin cảm ơn quý khách!',
            };

            let newPhone = invoice.phone;
            if (newPhone.startsWith('0')) {
                newPhone = `84${newPhone.slice(1)}`;
            }

            const trackingId = `invoice_${invoice._id}`;
            await redisClient.setEx(trackingId, 3600, newPhone); // Lưu số điện thoại trong Redis với thời gian hết hạn 1 giờ

            const zaloRes = await sendZNS(newPhone, templateId, templateData, trackingId);
            if (!zaloRes.success) {
                invoice.invoice_status = 4;
                invoice.history.push({
                    status: 4,
                    message: `Gửi hóa đơn thất bại: ${zaloRes.message}`,
                });
                invoice.invoice_message = zaloRes.message;
            } else {
                invoice.invoice_status = 2;
                invoice.history.push({
                    status: 2,
                    message: `Gửi hóa đơn thành công: ${zaloRes.message}`,
                });
                invoice.invoice_message = zaloRes.message;
            }
            await invoice.save();
            results.push({
                invoiceId: invoice._id,
                status: invoice.invoice_status,
                message: invoice.invoice_message,
                zaloRes,
            });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Invoices sent successfully',
            data: results,
        });
    }
    catch (error) {
        console.error('Send multiple invoices error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi hệ thống khi gửi hóa đơn',
            error: error.message,
        });
    }
}

exports.getReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required parameters: month and year'
            });
        }

        const invoices = await Invoice.find({ month: Number(month), year: Number(year) });

        if (!invoices.length) {
            return res.status(404).json({
                status: 'success',
                message: 'Không có dữ liệu hóa đơn cho tháng này',
                data: [],
            });
        }

        const report = invoices.map(invoice => {
            const latestHistory = invoice.history?.length
                ? invoice.history[invoice.history.length - 1]
                : null;

            return {
                customer_name: invoice.customer_name,
                phone: invoice.phone,
                room_code: invoice.room_code,
                room_price: invoice.room_price,
                actual_room_fee: invoice.actual_room_fee,
                electricity_fee: invoice.electricity?.price || 0,
                water_fee: invoice.water_fee || 0,
                management_fee: invoice.management_fee || 0,
                total_amount: invoice.total_amount,
                amount_paid: invoice.amount_paid,
                remaining_amount: invoice.remaining_amount,
                invoice_status: invoice.invoice_status,
                invoice_message: invoice.invoice_message,
                latest_send_status: latestHistory?.status || null,
                latest_send_message: latestHistory?.message || null,
                latest_send_time: latestHistory?.created_at || null,
            };
        });

        return res.status(200).json({
            status: 'success',
            message: 'Report generated successfully',
            data: report,
        });
    } catch (error) {
        console.error('Get report error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi hệ thống khi lấy báo cáo',
            error: error.message,
        });
    }
};

exports.syncFromSheet = async (req, res) => {
    try {
        const {
            spreadsheetId,
            range,
            month = new Date().getMonth() + 1,
            year = new Date().getFullYear(),
        } = req.body;
        const {
            sheetName = '78ds17',
            startRow = 15,
            endRow = 1000,
            startColumn = 'A',
            endColumn = 'AD'
        } = range;

        if (!spreadsheetId || !sheetName || !startRow || !endRow || !startColumn || !endColumn) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required parameters'
            });
        }

        await fetchSheetData({
            spreadsheetId,
            range: {
                sheetName,
                startRow,
                endRow,
                startColumn,
                endColumn
            },
            month,
            year
        });

        return res.status(200).json({
            status: 'success',
            message: 'Data synchronized successfully',
        });
    } catch (error) {
        console.error('Sync from sheet error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi hệ thống khi đồng bộ dữ liệu',
            error: error.message,
        });
    }
}