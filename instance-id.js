const http = require('http');

// Fetches this instance's ID via IMDSv2 (token-based). Resolves to
// 'unknown' rather than throwing if metadata isn't reachable (e.g.
// when testing locally, off-EC2), so the app still starts cleanly.
function getInstanceId() {
  return new Promise((resolve) => {
    const tokenReq = http.request(
      {
        host: '169.254.169.254',
        path: '/latest/api/token',
        method: 'PUT',
        headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '21600' },
        timeout: 2000,
      },
      (tokenRes) => {
        let token = '';
        tokenRes.on('data', (chunk) => (token += chunk));
        tokenRes.on('end', () => {
          const idReq = http.request(
            {
              host: '169.254.169.254',
              path: '/latest/meta-data/instance-id',
              method: 'GET',
              headers: { 'X-aws-ec2-metadata-token': token },
              timeout: 2000,
            },
            (idRes) => {
              let id = '';
              idRes.on('data', (chunk) => (id += chunk));
              idRes.on('end', () => resolve(id || 'unknown'));
            }
          );
          idReq.on('error', () => resolve('unknown'));
          idReq.on('timeout', () => resolve('unknown'));
          idReq.end();
        });
      }
    );
    tokenReq.on('error', () => resolve('unknown'));
    tokenReq.on('timeout', () => resolve('unknown'));
    tokenReq.end();
  });
}

module.exports = { getInstanceId };