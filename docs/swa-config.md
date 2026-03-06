# Azure Static Web Apps Configuration Notes

Placed at `app/public/staticwebapp.config.json`. Copied to `dist/` by Vite at build time.

## Settings

### MIME Types

```json
"mimeTypes": {
  ".wasm": "application/wasm",
  ".js": "text/javascript"
}
```

Azure SWA serves both `.wasm` and `.js` as `application/octet-stream` by default.
Browsers strictly check MIME types when loading ES modules, so `application/octet-stream`
causes a "Failed to load module script" error. These overrides fix that.

### Global Headers

```json
"globalHeaders": {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp"
}
```

The DuckDB-WASM EH (Exception Handling) bundle relies on `SharedArrayBuffer`.
`SharedArrayBuffer` requires COOP + COEP headers for security reasons.
The same headers are set for local development via `server.headers` in `vite.config.ts`.

### SPA Fallback Route

```json
"routes": [
  { "route": "/*", "serve": "/index.html", "statusCode": 200 }
]
```

A Vite-built SPA dynamically loads chunks such as `/assets/xxx.js`.
If SWA cannot resolve a route and returns 404, those JS chunks fail to load.
Falling back all paths to `index.html` ensures the SPA works correctly.
