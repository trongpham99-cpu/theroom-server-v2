const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = require('../src/models/user.model');

    // Liệt kê tất cả admin accounts
    const admins = await User.find({ role: 'admin' }).select('name email role');

    if (admins.length === 0) {
      console.log('❌ Không tìm thấy admin account nào!');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Danh sách Admin accounts:\n');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   ID: ${admin._id}\n`);
    });

    // Prompt user to choose which admin to reset
    console.log('📝 Để reset password, chạy lại script với email:');
    console.log('   node scripts/reset-admin-password.js <email> <new-password>');
    console.log('\nVí dụ:');
    console.log('   node scripts/reset-admin-password.js admin@example.com NewPassword123\n');

    // Check if email and password provided
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (email && newPassword) {
      // Validate password
      if (newPassword.length < 8) {
        console.log('❌ Password phải ít nhất 8 ký tự!');
        await mongoose.disconnect();
        return;
      }

      if (!newPassword.match(/\d/) || !newPassword.match(/[a-zA-Z]/)) {
        console.log('❌ Password phải có ít nhất 1 chữ cái và 1 số!');
        await mongoose.disconnect();
        return;
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log(`❌ Không tìm thấy user với email: ${email}`);
        await mongoose.disconnect();
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 8);

      // Update password
      user.password = hashedPassword;
      await user.save({ validateBeforeSave: false });

      console.log('✅ Password đã được reset thành công!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🔑 New Password: ${newPassword}`);
      console.log('\n⚠️  Hãy đổi password sau khi login!');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

resetAdminPassword();
