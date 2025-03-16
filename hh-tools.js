const https = require('https');

async function findStoreUrl(storeName) {
  return new Promise((resolve, reject) => {
    https.get('https://purchasetasks.com/stores', (res) => {
      let data = '';

      // A chunk of data has been received.
      res.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received.
      res.on('end', () => {
        try {
          // Create a simple HTML parser using regex
          const storePattern = new RegExp(`<a[^>]*>\\s*${storeName}\\s*products\\s*</a>`, 'i');
          const match = data.match(storePattern);
          
          if (match) {
            // Extract the href attribute
            const hrefMatch = match[0].match(/href="([^"]*)/);
            if (hrefMatch && hrefMatch[1]) {
              resolve(hrefMatch[1]);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = {
  findStoreUrl
};
