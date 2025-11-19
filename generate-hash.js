const bcrypt = require('bcryptjs');

bcrypt.hash('admin123', 10).then(hash => {
  console.log('Hash da senha admin123:');
  console.log(hash);
  process.exit(0);
});
