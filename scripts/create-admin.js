const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('\nGenerated password hash for "admin123":');
  console.log(hash);
  console.log('\nUse this hash in your SQL INSERT statement.');
}

generateHash();
