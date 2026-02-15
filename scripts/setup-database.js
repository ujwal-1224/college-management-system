const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function setupDatabase() {
  try {
    // Connect without database first
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Connected to MySQL server');

    // Read and execute schema
    const schema = fs.readFileSync('./config/schema.sql', 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('✓ Database created successfully');
    console.log('✓ Tables created successfully');
    console.log('✓ Admin user created (username: admin, password: admin123)');
    
    await connection.end();
    console.log('\nSetup complete! You can now run: npm start');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
