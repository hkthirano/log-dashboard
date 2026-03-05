# Log Dashboard

Apache アクセスログをブラウザだけで解析・可視化するツール。

## デモ

https://white-river-02cd2e900.4.azurestaticapps.net/

## 概要

- ファイル・フォルダをブラウザで直接開く（File System Access API）
- DuckDB-WASM による SQL 解析（サーバー不要）
- 総リクエスト数・ユニーク IP・エラー率・転送量の集計
- 上位 URL ランキング・ステータスコード分布を表示

## 開発

```bash
cd app
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開き、`sample-logs/` フォルダを選択して動作確認できます。

## デプロイ

本番デプロイはタグをプッシュすることで GitHub Actions がトリガーされます。

```bash
git tag v0.1.0
git push origin v0.1.0
```
