const { google } = require('googleapis');
const path = require('path');

const KEYFILEPATH = path.join(__dirname, '../key.json');

const Invoice = require('../models/invoice.model');
const Room = require('../models/room.model');
const Apartment = require('../models/apartment.model');
const Customer = require('../models/customer.model');

function parseRoomCustomers(input) {
  return input
    .split('\n')
    .map((line) => line.replace(/^\d+\)\s*/, '').trim())
    .filter((name) => name !== '');
}

function parseRoomCustomerPhones(input) {
  return input
    .split('\n')
    .map((line) => line.replace(/^\d+\)\s*/, '').trim())
    .filter((phone) => phone !== '');
}

function parseRoomGioiTinh(input) {
  return input
    .split('\n')
    .map((line) => line.replace(/^\d+\)\s*/, '').trim())
    .filter((gioiTinh) => gioiTinh !== '');
}

function parseRoomBirthDate(input) {
  return input
    .split('\n')
    .map((line) => {
      const match = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
      }
      return '';
    })
    .filter((date) => date !== '');
}

function toNumber(value) {
  if (!value) return 0;
  return Number(String(value).replace(/\./g, '').trim());
}

async function fetchSheetData({
  spreadsheetId = '1Vuv-Vv-BXuj4iLo6gMPqnvgU2JwzXPDxbCzNrftk8Cs',
  range: { sheetName = '78ds17', startRow = 15, endRow = 1000, startColumn = 'A', endColumn = 'AD' },
  month,
  year,
}) {
  const SPREADSHEET_ID = spreadsheetId;
  const RANGE = `${sheetName}!${startColumn}${startRow}:${endColumn}${endRow}`;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    for (let i = 3; i < response.data.values.length - 1; i++) {
      const row = response.data.values[i];

      const roomCode = row[0];

      if (!roomCode) {
        console.log(`Skipping row ${i + 1} due to missing room code.`);
        continue;
      }

      let isExitsApartment = await Apartment.findOne({ code: sheetName });
      if (!isExitsApartment) {
        isExitsApartment = new Apartment({ code: sheetName });
        await isExitsApartment.save();
      }

      let isExitsRoom = await Room.findOne({ code: roomCode, apartment_id: isExitsApartment._id });
      if (!isExitsRoom) {
        isExitsRoom = new Room({ code: roomCode, apartment_id: isExitsApartment._id });
        await isExitsRoom.save();
      }

      /** Customer Info */
      const roomCustomers = parseRoomCustomers(row[1]);
      const gioiTinh = parseRoomGioiTinh(row[2]);
      const birthDate = parseRoomBirthDate(row[3]);
      const roomCustomerPhone = parseRoomCustomerPhones(row[4]);

      /** Hop dong */
      const ngayVao = row[8]; // dd/mm/yyyy
      const kyHan = row[9]; // 6
      const ngayHetHan = row[10]; // dd/mm/yyyy

      /** Invoice Info */
      const giaThue = row[14];
      const soNgayO = row[15];
      const tienPhongThuc = row[16];
      const dienSoMoi = row[17];
      const dienSoCu = row[18];
      const tongSoKyDung = row[19];
      const tongTienDien = row[20];
      const soNguoiDungNuoc = row[21];
      const thanhTienNuoc = row[22];
      const phiQL = row[23];
      const noCu = row[24];
      const khauTru = row[25];
      const tongTien = row[26];
      const daThanhToan = row[27];
      const tienConPhaiThu = row[28];
      const ghiChu = row[29] || '';

      if (!roomCode || !roomCustomers.length) {
        console.log(`Skipping row ${i + 1} due to missing room code or customers.`);
        continue;
      }

      for (let j = 0; j < roomCustomerPhone.length; j++) {
        if (roomCustomerPhone[j].length < 10) {
          console.log(`Skipping customer ${roomCustomers[j]} in room ${roomCode} due to invalid phone number.`);
          continue;
        }

        let newPhone;
        if (roomCustomerPhone[j].startsWith('0')) {
          newPhone = `84${roomCustomerPhone[j].slice(1)}`;
        }

        const roomCustomer = {
          uuid: null,
          name: roomCustomers[j],
          phone: newPhone,
          dob: birthDate[j] ? new Date(birthDate[j]) : null,
          room_id: isExitsRoom._id,
          apartment_id: isExitsApartment._id,
        };

        let customer = await Customer.findOne({
          phone: roomCustomerPhone[j],
        });
        if (!customer) {
          customer = new Customer(roomCustomer);
          await customer.save();
          console.log(`Customer ${roomCustomers[j]} created successfully.`);
        } else {
          customer.name = roomCustomers[j];
          customer.dob = birthDate[j] ? new Date(birthDate[j]) : null;
          customer.room_id = isExitsRoom._id;
          customer.apartment_id = isExitsApartment._id;
          await customer.save();
          console.log(`Customer ${roomCustomers[j]} updated successfully.`);
        }

        const monthInvoiceIsExists = await Invoice.findOne({
          room_code: roomCode,
          customer_name: roomCustomers[j],
          month,
          year,
        });

        if (monthInvoiceIsExists) {
          const updateInvoice = await Invoice.findOneAndUpdate(
            {
              room_code: roomCode,
              customer_name: roomCustomers[j],
              month,
              year,
            },
            {
              room_price: toNumber(giaThue),
              stay_days: toNumber(soNgayO),
              actual_room_fee: toNumber(tienPhongThuc),
              electricity: {
                old_index: toNumber(dienSoCu),
                new_index: toNumber(dienSoMoi),
                used_kwh: toNumber(tongSoKyDung),
                price: toNumber(tongTienDien),
              },
              water_usage: toNumber(soNguoiDungNuoc),
              water_fee: toNumber(thanhTienNuoc),
              management_fee: toNumber(phiQL),
              old_debt: toNumber(noCu),
              deduction: toNumber(khauTru),
              total_amount: toNumber(tongTien),
              amount_paid: toNumber(daThanhToan),
              remaining_amount: toNumber(tienConPhaiThu),
              note: ghiChu,
            },
            { new: true }
          );
          if (updateInvoice) {
            console.log(`Invoice for ${roomCustomers[j]} updated successfully.`);
          } else {
            console.log(`Failed to update invoice for ${roomCustomers[j]}.`);
          }
        } else {
          const newInvoice = new Invoice({
            room_code: roomCode,

            customer_name: roomCustomers[j],
            gender: gioiTinh[j] || 'N/A',
            birth_date: birthDate[j] ? new Date(birthDate[j]) : null,
            phone: roomCustomerPhone[j] || '',

            contract: {
              start_date: ngayVao ? new Date(ngayVao.split('/').reverse().join('-')) : null,
              end_date: ngayHetHan ? new Date(ngayHetHan.split('/').reverse().join('-')) : null,
              duration_months: toNumber(kyHan),
            },

            deposit_amount: 0,

            room_price: toNumber(giaThue),
            stay_days: toNumber(soNgayO),
            actual_room_fee: toNumber(tienPhongThuc),

            electricity: {
              old_index: toNumber(dienSoCu),
              new_index: toNumber(dienSoMoi),
              used_kwh: toNumber(tongSoKyDung),
              price: toNumber(tongTienDien),
            },

            water_usage: toNumber(soNguoiDungNuoc),
            water_fee: toNumber(thanhTienNuoc),
            management_fee: toNumber(phiQL),

            old_debt: toNumber(noCu),
            deduction: toNumber(khauTru),
            total_amount: toNumber(tongTien),
            amount_paid: toNumber(daThanhToan),
            remaining_amount: toNumber(tienConPhaiThu),
            month,
            year,
            note: ghiChu,
          });

          const savedInvoice = await newInvoice.save();
          if (savedInvoice) {
            console.log(`Invoice for ${roomCustomers[j]} saved successfully.`);
          } else {
            console.log(`Failed to save invoice for ${roomCustomers[j]}.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

module.exports = {
  fetchSheetData,
};
