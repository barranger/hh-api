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

async function findProductUrl(storeUrl, productName) {
  return new Promise((resolve, reject) => {
    https.get(storeUrl, (res) => {
      let data = '';

      // A chunk of data has been received
      res.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received
      res.on('end', () => {
        try {
          // Extract all product links and their text
          const productLinks = [];
          const linkPattern = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
          let match;

          while ((match = linkPattern.exec(data)) !== null) {
            productLinks.push({
              url: match[1],
              text: match[2].trim()
            });
          }
          
          // Find the best matching product
          const bestMatch = findBestMatch(productLinks, productName);
          resolve(bestMatch ? bestMatch.url : null);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Helper function to find the best matching product
function findBestMatch(products, description) {
  // Convert description to lowercase for case-insensitive matching
  const descWords = description.toLowerCase().split(/\s+/);
  
  let bestMatch = null;
  let highestScore = 0;

  products.forEach(product => {
    const productText = product.text.toLowerCase();
    let score = 0;

    // Count how many words from the description appear in the product text
    descWords.forEach(word => {
      if (productText.includes(word)) {
        score++;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = product;
    }
  });

  return bestMatch;
}

module.exports = {
  findStoreUrl,
  findProductUrl
};
