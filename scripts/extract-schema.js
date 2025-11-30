const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function analyzeSchema() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log(`Found ${collections.length} collections:\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Collection: ${collectionName}`);
      console.log('='.repeat(60));

      const collection = db.collection(collectionName);

      // Lấy 1 document mẫu để phân tích structure
      const sampleDoc = await collection.findOne({});

      if (!sampleDoc) {
        console.log('  (Empty collection)');
        continue;
      }

      // Phân tích schema từ document mẫu
      console.log('\nSchema structure:');
      printSchema(sampleDoc, '  ');

      // Đếm số documents
      const count = await collection.countDocuments();
      console.log(`\nTotal documents: ${count}`);

      // Lấy thêm vài documents để kiểm tra variations
      const samples = await collection.find({}).limit(5).toArray();
      const allFields = new Set();

      samples.forEach(doc => {
        Object.keys(doc).forEach(key => allFields.add(key));
      });

      console.log('\nAll fields found in first 5 docs:');
      console.log('  ' + Array.from(allFields).join(', '));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Schema analysis complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

function printSchema(obj, indent = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__v') continue; // Skip mongoose version key

    const type = getType(value);

    if (type === 'Object' && value && !Array.isArray(value) && !(value instanceof Date)) {
      console.log(`${indent}${key}: {`);
      printSchema(value, indent + '  ');
      console.log(`${indent}}`);
    } else if (type === 'Array' && value.length > 0) {
      console.log(`${indent}${key}: [${getType(value[0])}]`);
      if (typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0])) {
        printSchema(value[0], indent + '  ');
      }
    } else {
      console.log(`${indent}${key}: ${type}`);
    }
  }
}

function getType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'Array';
  if (value instanceof Date) return 'Date';
  if (value instanceof mongoose.Types.ObjectId) return 'ObjectId';
  if (typeof value === 'object' && value._bsontype === 'ObjectId') return 'ObjectId';

  const type = typeof value;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Run the analysis
analyzeSchema();
