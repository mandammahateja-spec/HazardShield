const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const html = await get('https://hazard-shield.vercel.app/community');
  const regex = /src="(\/_next\/static\/chunks\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const chunkUrl = 'https://hazard-shield.vercel.app' + match[1];
    const js = await get(chunkUrl);
    if (js.includes('http://localhost:5000')) {
      console.log('Found http://localhost:5000 in', match[1]);
    }
    const onrenderMatches = js.match(/https:\/\/[a-zA-Z0-9_\-\.]+\.onrender\.com/g);
    if (onrenderMatches) {
      console.log('Found onrender URLs in', match[1], onrenderMatches);
    }
  }
}

run().catch(console.error);
