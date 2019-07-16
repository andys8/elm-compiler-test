const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream('search.json');
https.get('https://package.elm-lang.org/search.json', response => response.pipe(file));
