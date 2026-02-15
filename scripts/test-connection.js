const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing MySQL connection...\n');
  console.log('Configuration:');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`User: ${process.env.DB_USER}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`Password: ${process.env.DB_PASSWORD ? '***' : '(empty)'}\n`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✓ Successfully connected to MySQL server!');
    
    // Check if database exists
    const [databases] = await connection.query(
      'SHOW DATABASES LIKE ?',
      [process.env.DB_NAME]
    );

    if (databases.length > 0) {
      console.log(`✓ Database '${process.env.DB_NAME}' exists`);
      
      // Check tables
      await connection.query(`USE ${process.env.DB_NAME}`);
      const [tables] = await connection.query('SHOW TABLES');
      
      if (tables.length > 0) {
        console.log(`✓ Found ${tables.length} tables in database`);
        console.log('\nTables:');
        tables.forEach(table => {
          console.log(`  - ${Object.values(table)[0]}`);
        });
      } else {
        console.log('⚠ Database exists but no tables found');
        console.log('Run: npm run setup');
      }
    } else {
      console.log(`⚠ Database '${process.env.DB_NAME}' does not exist`);
      console.log('Run: npm run setup');
    }

    await connection.end();
    console.log('\n✓ Connection test complete!');
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check if MySQL is running');
    console.log('2. Verify credentials in .env file');
    console.log('3. Make sure MySQL port 3306 is accessible');
    process.exit(1);
  }
}

testConnection();
