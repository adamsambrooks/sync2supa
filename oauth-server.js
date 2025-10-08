const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const code = parsedUrl.query.code;

  if (code) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`
      <h1>Authorization Successful!</h1>
      <h2>Your Authorization Code:</h2>
      <p style="font-size:20px; word-break:break-all; background:#f0f0f0; padding:20px;">${code}</p>
      <p>Copy this code and paste it into the terminal where you ran "npm run authorize"</p>
    `);
    console.log('\n========================================');
    console.log('Authorization code:', code);
    console.log('========================================\n');
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Waiting for authorization...</h1><p>Click the authorization link to continue.</p>');
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`OAuth callback server running on http://localhost:${PORT}`);
  console.log('Waiting for authorization callback...');
});
