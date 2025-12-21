const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('Type:', pkg.type);
console.log('Files in dir:', fs.readdirSync('.'));
