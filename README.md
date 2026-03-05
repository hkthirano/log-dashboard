# Log Dashboard

Apache アクセスログをブラウザだけで解析・可視化するツール。

## デモ

https://white-river-02cd2e900.4.azurestaticapps.net/

## 概要

サーバー不要。ログファイルはブラウザ外に出ず、すべてローカルで処理される。

## アーキテクチャ

```
[ローカルのログファイル]
        |
        | File System Access API
        | (showOpenFilePicker / showDirectoryPicker)
        v
[ブラウザ内メモリ: テキスト読み込み]
        |
        | ログパーサー (正規表現)
        | Apache Combined/Common 形式を解析
        v
[DuckDB-WASM: インメモリ SQL エンジン]
        |  - WebAssembly で動作するフル機能の DuckDB
        |  - logs テーブルに INSERT
        |  - SQL で集計クエリを実行
        |
        +---> 集計結果をダッシュボードに表示
        |
        | COPY logs TO 'file.parquet' (FORMAT PARQUET)
        | copyFileToBuffer() で Parquet バイト列を取得
        v
[OPFS: Origin Private File System]
        |  - ブラウザが管理するプライベートなファイルシステム
        |  - FileSystemWritableFileStream で Parquet を書き込み
        |  - ページをリロードしても保持される
        v
[次回起動時: OPFS から自動復元]
        |  - logs.parquet を読み込み DuckDB に registerFileBuffer
        |  - CREATE TABLE AS SELECT * FROM read_parquet(...)
        v
[ダッシュボードを自動表示]
```

### 各技術の役割

| 技術 | 役割 |
|------|------|
| **File System Access API** | ユーザーのローカルファイル/フォルダをブラウザで読み取る |
| **DuckDB-WASM** | ブラウザ内で SQL を実行するインメモリ分析エンジン |
| **OPFS** | ページリロードをまたいでデータを永続化するブラウザ内ストレージ |

### Cross-Origin Isolation

DuckDB-WASM の Worker と OPFS は `SharedArrayBuffer` を必要とするため、COOP/COEP ヘッダーによる Cross-Origin Isolated 環境が必要。

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`staticwebapp.config.json` と Vite 開発サーバー設定で付与している。

## 機能

- ファイル・フォルダをブラウザで直接開く（File System Access API）
- DuckDB-WASM による SQL 解析（サーバー不要）
- 総リクエスト数・ユニーク IP・エラー率・転送量の集計
- 上位 URL ランキング・ステータスコード分布を表示
- OPFS によるデータ永続化（リロード後も自動復元）

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
