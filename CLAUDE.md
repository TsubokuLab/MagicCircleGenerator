# CLAUDE.md

このファイルはClaude Code (AIアシスタント) がこのリポジトリで作業する際のガイドラインです。

## プロジェクト概要

**魔法陣ジェネレーター** — ブラウザで動作するインタラクティブな魔法陣作成ツール。
バニラJS + HTML5 Canvas のみで構成されたシングルページアプリケーション。

- 作者: kohack_v (@kohack_v)
- デモ: https://tsubokulab.github.io/MagicCircleGenerator/
- GitHub: https://github.com/TsubokuLab/MagicCircleGenerator

## ファイル構成

```
index.html          # メインHTML・UIレイアウト
js/
  main.js           # コアロジック全体（約2000行）
  FileSaver.min.js  # ファイル保存ライブラリ（変更不要）
css/
  style.css         # スタイル定義
img/                # favicon・thumbnail等の画像アセット
package.json        # npm設定（gh-pagesのみ使用）
```

## アーキテクチャ

### グローバル状態 (`app` オブジェクト)

```js
app.layers        // Layer インスタンスの配列
app.activeLayer   // 現在選択中のレイヤー
app.nextLayerId   // 次のレイヤーIDのカウンター
app.settings      // backgroundColor / foregroundColor / transparentBackground
app.history       // Undo/Redo 用スナップショット配列（最大31件）
app.historyIndex  // 現在の履歴位置
app.editingLayer  // 編集中のレイヤー（null = 通常モード）
```

### 主要コンポーネント

| 名前 | 場所 | 役割 |
|------|------|------|
| `Layer` クラス | main.js | レイヤーデータとレンダリングロジック |
| `LayerManager` | main.js | レイヤーの追加・削除・移動・複製・UI更新 |
| `Exporter` | main.js | PNG/SVG/ノーマルマップ/JSON書き出し |
| `Utils` | main.js | 座標変換ユーティリティ |
| `renderCanvas()` | main.js | メイン描画関数 |
| `saveHistory()` | main.js | Undo/Redo 用スナップショット保存 |

### レイヤータイプ

- `circle` — 円（radius, thickness, style, dashLength, dashGap）
- `shapes` — 図形配置（shapeType, size, count, radius, offset, rotation, aspect, fill）
- `lines` — 線（lineType, count, radius, thickness, offset, starFactor）

## 開発コマンド

```bash
npm install          # 依存関係インストール
npm run deploy       # GitHub Pages へデプロイ (gh-pages)
```

ローカル確認は `index.html` をブラウザで直接開く（サーバー不要）。

## コーディング規約

- **フレームワーク不使用** — バニラJS/CSS/HTML のみ。ライブラリ追加は慎重に。
- **BASE_CANVAS_SIZE = 1024** — 描画の基準サイズ。テクスチャ書き出し時はスケール係数で対応。
- `renderCanvas()` はどのレイヤー変更後にも必ず呼ぶ。
- `LayerManager` のメソッド経由でレイヤーを操作し、`app.layers` を直接変更しない。
- 状態変更前（レイヤー追加・削除・移動・編集）は `saveHistory()` を呼ぶ。
- `layer.isGhost = true` のレイヤーはプレビュー用。履歴スナップショットに含めない。

## よくある作業

### 新しいレイヤータイプを追加する

1. `Layer.render()` に `case 'newtype':` を追加
2. `Layer.renderNewtype()` メソッドを実装
3. `LayerManager.getLayerName()` に表示名を追加
4. `index.html` にUIコントロールを追加
5. `setupEventListeners()` に追加ボタンのハンドラを追加
6. `Exporter.createSVGFromLayer()` にSVG変換を追加
7. `getPreviewParams()` にゴーストガイドパラメータを追加
8. `loadLayerParamsToUI()` にパラメータ読み込みを追加

### 書き出しフォーマットを追加する

1. `Exporter.exportImage()` に `case 'newformat':` を追加
2. `index.html` の `#export-format` に `<option>` を追加

## デプロイ

```bash
npm run deploy
```

`gh-pages` パッケージが `master` ブランチの内容を GitHub Pages に公開する。
`deployToGithub.bat`（Windows用）も同様の処理を行う。

## 注意事項

- `FileSaver.min.js` は外部ライブラリのため変更不要
- Google Analytics (G-TFTH0DVE14) と AdSense が組み込まれている（本番用）
- `index.html` の `<datalist id="markers">` が複数あるが、これは既知の重複（スライダーのスナップ用）
