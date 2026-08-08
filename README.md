# htmm

FreeMind互換の .mm 形式を扱う、軽量で埋め込み可能なマインドマップUIコンポーネント

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

---

## 特徴

- **FreeMind互換:** `.mm` ファイルの完全な読み書き
- **React製:** モダンなフロントエンド技術
- **キーボードショートカット:** FreeMind互換の操作性
- **豊富なスタイリング:** 色、フォント、アイコン、クラウド対応
- **リンク・ノート:** 外部リンクやリッチコンテンツ
- **レスポンシブ:** デスクトップ・モバイル対応
- **埋め込み可能:** 任意のウェブサイトに統合
- **読み込み専用モード:** 表示のみにしたい場合に編集操作を無効化可能

## クイックスタート

htmm の利用方法は次の2通りです。

### A. パッケージとして利用（動的リンク）

Vite や webpack などバンドラーを使う場合は、npm でインストールして `import` で利用します。

```bash
npm install @tomk79/htmm
# または
yarn add @tomk79/htmm
# または
pnpm add @tomk79/htmm
```

### B. ビルド済みスクリプトで利用

バンドラーを使わない場合は、`dist/htmm.js` または `dist/htmm.min.js` を 1 本の `<script>` で読み込んで利用できます。リポジトリの `dist/` や、npm パッケージの `node_modules/@tomk79/htmm/dist/`、CDN からファイルを用意してください。React などの別読み込みは不要で、スタイルも JS 内で注入されます。

```html
<div id="root"></div>
<script src="path/to/htmm.min.js"></script>
<script>
  const { createRoot } = window.ReactDOM;
  const { HtmmMap } = window.htmm;
  const root = createRoot(document.getElementById('root'));
  root.render(/* あなたのアプリ */);
</script>
```

グローバル変数 `window.htmm` からコンポーネントやフックを取得できます。React / ReactDOM はバンドルに含まれるため、`window.React` と `window.ReactDOM` も利用可能です。

### 基本的な使い方（パッケージ利用時）

各 `<HtmmMap />` は内部で専用のストアを持ち、`src` もしくは `initialMapData` を渡さない場合は空のマップが自動作成されます。1つだけでも複数でも同じように使えます。

```tsx
import { HtmmMap } from '@tomk79/htmm';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* 空のマップを表示 */}
      <HtmmMap width="100%" height="100%" />
    </div>
  );
}
```

URL から .mm を読み込む場合は **`src`** を指定します。

```tsx
<HtmmMap src="/path/to/map.mm" width="100%" height="100%" />
```

### .mmファイルの読み込み（ref を使う場合）

親コンポーネントから「ファイルを開く」などでデータを渡す場合は、ref の **`loadMap`** を使います。

```tsx
import { useRef } from 'react';
import { HtmmMap, loadMindMapFile } from '@tomk79/htmm';
import type { HtmmMapHandle } from '@tomk79/htmm';

function FileLoader() {
  const mapRef = useRef<HtmmMapHandle>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mapData = await loadMindMapFile(file);
      mapRef.current?.loadMap(mapData);
    }
  };

  return (
    <>
      <input type="file" accept=".mm" onChange={handleFileChange} />
      <HtmmMap ref={mapRef} width="100%" height="600px" />
    </>
  );
}
```

### .mmファイルの保存（ref を使う場合）

保存する場合は ref の **`getMapData`** で現在のマップデータを取得します。

```tsx
import { useRef } from 'react';
import { HtmmMap, saveMindMapFile } from '@tomk79/htmm';
import type { HtmmMapHandle } from '@tomk79/htmm';

function SaveButton() {
  const mapRef = useRef<HtmmMapHandle>(null);

  const handleSave = () => {
    const mapData = mapRef.current?.getMapData();
    if (mapData) {
      saveMindMapFile(mapData, 'my-mindmap.mm');
    }
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <HtmmMap ref={mapRef} width="100%" height="600px" />
    </>
  );
}
```

### 1ページに複数マップを配置する

各 `<HtmmMap />` は常に専用のストアを持つため、複数並べるだけで独立したマップになります。初期データは **`src`** で .mm の URL を指定するか、**`initialMapData`** でオブジェクトを渡します。

```tsx
import { HtmmMap } from '@tomk79/htmm';

function MultiMapPage() {
  return (
    <div>
      <HtmmMap src="/map1.mm" width="100%" height="400px" />
      <HtmmMap src="/map2.mm" width="100%" height="400px" />
    </div>
  );
}
```

### 読み込み専用（ReadOnly）モード

表示専用で編集を禁止したい場合は、**`readOnly`** プロパティを指定してください。読み込み専用モードでは次の操作はできません。

- **できないこと:** ノードの追加・変更・削除、並び替え（ドラッグ＆ドロップ）、カット・ペースト、スタイル変更、Undo/Redo など
- **できること:** ノードの選択、ノードの開閉（折りたたみ）、ズーム・パン、コピー

```tsx
// 空のマップを読み込み専用で表示
<HtmmMap readOnly width="100%" height="600px" />

// src で読み込んで読み込み専用
<HtmmMap src="/map.mm" readOnly width="100%" height="400px" />
```

### 表示テーマ（appearance）と言語（lang）

マップの見た目と言語を初期化オプションで指定できます。

- **`appearance`** — テーマを指定します。`'dark'`（ダーク）、`'light'`（ライト）、`'auto'`（OSの設定に従う）。省略時は `'auto'` です。
- **`lang`** — マップのルート要素に付与する言語コード（BCP 47、例: `'en'`, `'ja'`）。アクセシビリティや言語指定に利用します。省略時は `'en'` です。

```tsx
// 常にダークテーマで表示
<HtmmMap appearance="dark" width="100%" height="600px" />

// 常にライトテーマ
<HtmmMap appearance="light" width="100%" height="600px" />

// 言語を日本語に（省略時は en）
<HtmmMap lang="ja" width="100%" height="600px" />

// 組み合わせ
<HtmmMap appearance="dark" lang="ja" src="/map.mm" width="100%" height="400px" />
```

`useHtmmStore()` は **HtmmMap の内側**（子コンポーネント）でのみ利用できます。HtmmMap の外から操作する場合は ref の `loadMap` / `getMapData` を使ってください。

## 主要API

### コンポーネント

#### `<HtmmMap />`

```tsx
<HtmmMap 
  ref={mapRef}            // 省略可。loadMap / getMapData で操作するときに指定
  width="100%" 
  height="600px" 
  className="custom-class"
  src="/path/to/map.mm"   // 省略可。.mm の URL を指定するとここから読み込む
  initialMapData={mapData} // 省略可。src がないときに使う初期データ
  readOnly={false}        // 省略可。true にすると編集不可（選択・開閉・ズーム・コピーは可能）
  appearance="auto"       // 省略可。'dark' | 'light' | 'auto'。デフォルトは 'auto'（OSに従う）
  lang="en"               // 省略可。言語コード（例: en, ja）。デフォルトは 'en'
/>
```

ref で取得できる **HtmmMapHandle** のメソッド:

- **`loadMap(data)`** — マップデータを差し替える
- **`getMapData()`** — 現在のマップデータを返す（保存時に利用）

### フック

#### `useHtmmStore()`

**HtmmMap の内側**（子コンポーネント）でのみ利用できます。ツールバーなどを HtmmMap の子として配置し、ここで取得した操作でノードの追加・編集などを行います。

```tsx
const {
  // データ
  mapData,
  selectedNodeIds,
  editable,
  readOnly,
  
  // マップ操作
  newMap,
  loadMap,
  
  // ノード操作
  addChild,
  addSibling,
  deleteNode,
  editNode,
  moveNode,
  
  // スタイリング
  setNodeColor,
  setNodeBackgroundColor,
  setFont,
  setNodeStyle,
  
  // 折りたたみ
  toggleFolded,
  foldAll,
  unfoldAll,
  
  // 履歴
  undo,
  redo,
  
  // 選択
  selectNode,
  deselectAll,
  
  // クリップボード
  cutNode,
  copyNode,
  pasteNode,
  
  // 設定
  setEditable,
  setReadOnly,
} = useHtmmStore();
```

### ユーティリティ関数

#### ファイルI/O

```tsx
// 読み込み
const mapData = await loadMindMapFile(file);
const mapData = await loadMindMapURL('https://example.com/map.mm');
const mapData = parseMindMapXML(xmlString);

// 保存
saveMindMapFile(mapData, 'filename.mm');
const blob = getMindMapBlob(mapData);
const xmlString = generateMindMapXML(mapData);
```

#### ノード操作

```tsx
import {
  createNode,
  createRootNode,
  findNodeById,
  findParentNode,
  cloneNode,
  getNodePath,
  hasChildren,
} from '@tomk79/htmm';

const node = createNode('My Node');
const root = createRootNode('Root');
const found = findNodeById(root, 'ID_123');
const parent = findParentNode(root, 'ID_123');
const cloned = cloneNode(node, true);
```

## キーボードショートカット

| ショートカット | アクション |
|--------------|----------|
| `Tab` | 子ノードを追加 |
| `Enter` | 兄弟ノードを追加 |
| `Shift+Enter` | 前の兄弟を追加 |
| `Delete` | ノードを削除 |
| `Space` | 折りたたみ切替 |
| `Ctrl+Z` / `Cmd+Z` | 元に戻す |
| `Ctrl+Y` / `Cmd+Y` | やり直し |
| `Ctrl+C` / `Cmd+C` | コピー |
| `Ctrl+X` / `Cmd+X` | カット |
| `Ctrl+V` / `Cmd+V` | ペースト |
| Double Click | ノードを編集 |

※ 読み込み専用モード（`readOnly={true}`）のときは、上記のうち編集系（追加・削除・変更・並び替え・ペースト・Undo/Redo など）は無効になります。矢印キーでの移動と `Space` による折りたたみ、`Ctrl+C` によるコピーは利用できます。

## スタイリング例

```tsx
const { setNodeColor, setNodeBackgroundColor, setFont, setNodeStyle } = useHtmmStore();

// テキスト色を変更
setNodeColor(nodeId, '#ff0000');

// 背景色を変更
setNodeBackgroundColor(nodeId, '#ffff00');

// フォントを変更
setFont(nodeId, {
  size: 16,
  bold: true,
  italic: false,
  name: 'Arial',
});

// ノードスタイルを変更
setNodeStyle(nodeId, 'bubble'); // 'fork' | 'bubble'
```

## 更新履歴

### @tomk79/htmm v0.1.1 (リリース日未定)

- 全画面表示のターゲットが常にビューポート全体になるようになった。
- エッジに近い座標で、ドラッグによるスクロールパンが効かなくなる問題を修正。
- スモールスクリーン時のスタイリングの改善。

### @tomk79/htmm v0.1.0 (2026年8月5日)

- ライセンスを GNU GPL v2 から MIT License に変更。

### @tomk79/htmm v0.0.2 (2026年2月21日)

- npm のエントリーポイントを修正。
- 公開ファイルリストの不備を修正。
- 複数のマインドマップを配置できるようになった。
- オブジェクト名称の変更。
- 読み込み専用（ReadOnly）モードを追加。`<HtmmMap readOnly />` または `createHtmmStore({ readOnly: true })` で、ノードの追加・変更・削除・並び替え・ペーストなどを無効にしつつ、選択・開閉・ズーム・コピーは利用可能。
- `lang` と `appearance` オプションを追加。
- 長いノードのコンテンツを、改行してすべて表示するようになった。
- ノードに含まれる改行を反映するようになった。
- その他UIの改善、不具合の修正など。

### @tomk79/htmm v0.0.1 (2026年2月15日)

- Initial Release.


## 開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド（デモ用 SPA と配布用 dist/htmm.js・htmm.min.js の両方を生成）
npm run build

# ライブラリのみビルドする場合
npm run build:lib

# プレビュー
npm run preview
```

### ディレクトリ構造

```
htmm/
├── src/                  # パッケージ本体（公開用）
│   ├── components/       # Reactコンポーネント
│   ├── store/            # 状態管理 (Zustand)
│   ├── io/               # ファイルI/O
│   ├── layout/           # レイアウトエンジン
│   ├── models/           # ビジネスロジック
│   ├── types/            # TypeScript型定義
│   ├── utils/            # ユーティリティ
│   ├── hooks/            # Reactフック
│   ├── styles/           # スタイル（例: 印刷用CSS）
│   └── collab/           # 協調編集
├── tests/
│   ├── demo/             # ローカル開発用デモアプリ（dev/preview のルート）
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── demo.css
│   │   └── public/
│   └── e2e/              # E2Eテスト
└── dist/                 # ビルド出力（npm run build で生成）
    ├── htmm.js           # 配布用ライブラリ（非圧縮）
    └── htmm.min.js       # 配布用ライブラリ（圧縮）
```

## 貢献

貢献を歓迎します！ Issue や Pull Request をお気軽にお送りください。

## ライセンス

MIT License

本プロジェクトは [FreeMind](http://freemind.sourceforge.net/) の `.mm` 形式に対応していますが、独自に実装されたものです。

なお、v0.0.2 までは GNU GPL v2 として公開していましたが、v0.1.0 以降は MIT License に変更しています。

## 謝辞

- [FreeMind](http://freemind.sourceforge.net/) - Christian Foltin氏と貢献者の皆様
- [Zustand](https://github.com/pmndrs/zustand) - 状態管理ライブラリ
- [Vite](https://vitejs.dev/) - 高速ビルドツール
- [React](https://react.dev/) - UIフレームワーク
