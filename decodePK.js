let base64url = require('base64url');

const pk = process.argv[2];

console.log(base64url.toBuffer(pk).toString('hex'));
