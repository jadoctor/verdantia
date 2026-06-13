const https = require('https');

function getLogs(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        getLogs(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const jobId = '81200738463';
    console.log(`Fetching logs for job: ${jobId}...`);
    const res = await getLogs(`https://api.github.com/repos/jadoctor/verdantia/actions/jobs/${jobId}/logs`);
    console.log(`Status Code: ${res.status}`);
    if (res.status === 200) {
      // Print the last 100 lines of the log
      const lines = res.body.split('\n');
      console.log(`Total lines: ${lines.length}`);
      console.log('--- Log Output (Last 100 lines) ---');
      console.log(lines.slice(-100).join('\n'));
    } else {
      console.log('Failed to fetch logs:', res.body);
    }
  } catch (err) {
    console.error(err);
  }
}

main();
