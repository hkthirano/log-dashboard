# Azure Static Web Apps 設定メモ

`app/public/staticwebapp.config.json` に配置。Vite ビルド時に `dist/` へコピーされる。

## 設定内容

### MIME タイプ

```json
"mimeTypes": {
  ".wasm": "application/wasm",
  ".js": "text/javascript"
}
```

Azure SWA のデフォルトは `.wasm` / `.js` ともに `application/octet-stream` で返す。
ブラウザは ES module を読み込む際に MIME タイプを厳格にチェックするため、
`application/octet-stream` だと "Failed to load module script" エラーになる。

### グローバルヘッダー

```json
"globalHeaders": {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp"
}
```

DuckDB-WASM の EH（Exception Handling）バンドルは `SharedArrayBuffer` を使う。
`SharedArrayBuffer` はセキュリティ要件として COOP + COEP ヘッダーが必要。
ローカル開発は `vite.config.ts` の `server.headers` で同様に設定している。

### SPA フォールバックルート

```json
"routes": [
  { "route": "/*", "serve": "/index.html", "statusCode": 200 }
]
```

Vite でビルドした SPA は `/assets/xxx.js` などのチャンクを動的にロードする。
SWA がルートを解決できない場合に 404 を返すと JS チャンク自体が取得できなくなる。
全パスを `index.html` にフォールバックすることで SPA として正しく動作する。
