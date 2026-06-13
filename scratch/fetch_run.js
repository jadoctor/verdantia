const https = require('https');

function getJSON(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const sha = '886e4421e8f88aa282361cc4a26e75e839b90e35';
    const checkRuns = await getJSON(`https://api.github.com/repos/jadoctor/verdantia/commits/${sha}/check-runs`);
    if (!checkRuns.check_runs || checkRuns.check_runs.length === 0) {
      console.log('No check runs found');
      return;
    }
    for (const cr of checkRuns.check_runs) {
      console.log(`Name: ${cr.name}`);
      console.log(`Status: ${cr.status}`);
      console.log(`Conclusion: ${cr.conclusion}`);
      if (cr.output) {
        console.log(`Output Title: ${cr.output.title}`);
        console.log(`Output Summary: ${cr.output.summary}`);
        console.log(`Output Text: ${cr.output.text}`);
      }
      console.log('---------------------------------');
    }
  } catch (err) {
    console.error(err);
  }
}

main();
