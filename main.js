const { app, BrowserWindow, shell, Menu, session } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WWW = path.join(__dirname, 'www');
const PREFERRED_PORT = 47832; // fixed so bookmarks/settings (localStorage) survive restarts

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Tiny local server so the app runs from http://127.0.0.1 (a proper origin).
function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.normalize(path.join(WWW, urlPath));
    if (!filePath.startsWith(WWW)) { res.writeHead(403); return res.end(); }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    const tryListen = (port) => {
      server.once('error', () => { if (port !== 0) tryListen(0); });
      server.listen(port, '127.0.0.1', () => resolve(server.address().port));
    };
    tryListen(PREFERRED_PORT);
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win;
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(async () => {
    const port = await startServer();
    Menu.setApplicationMenu(null);

    // Like a normal browser, let pages load inside the app's Browse frame:
    // remove the "don't embed me" headers (only for embedded frames).
    session.defaultSession.webRequest.onHeadersReceived(
      { urls: ['http://*/*', 'https://*/*'] },
      (details, callback) => {
        const headers = details.responseHeaders || {};
        if (details.resourceType === 'subFrame') {
          for (const k of Object.keys(headers)) {
            const low = k.toLowerCase();
            if (low === 'x-frame-options') delete headers[k];
            if (low === 'content-security-policy') {
              headers[k] = headers[k].map((v) =>
                v.replace(/frame-ancestors[^;]*;?/gi, '')
              );
            }
          }
        }
        callback({ responseHeaders: headers });
      }
    );

    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(true));

    win = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 480,
      minHeight: 600,
      backgroundColor: '#080a0f',
      title: 'VALIRYAN FREEHOLD',
      icon: path.join(__dirname, 'build', 'icon.png'),
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false }
    });

    // Links that want a new window open in the system browser
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:/i.test(url)) shell.openExternal(url);
      return { action: 'deny' };
    });

    win.loadURL(`http://127.0.0.1:${port}/index.html`);
  });

  app.on('window-all-closed', () => app.quit());
}
