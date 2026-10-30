// Custom production server for cPanel / DirectAdmin / Web Hosting Node.js Selector
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, () => {
    console.log(`> Next.js production server running on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error preparing Next.js app:', err);
  process.exit(1);
});
