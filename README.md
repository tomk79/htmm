# htmm

FreeMind互換の .mm 形式を扱う、軽量で埋め込み可能なマインドマップUIコンポーネント

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
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
  const { HtmmMap, useHtmmStore } = window.htmm;
  const root = createRoot(document.getElementById('root'));
  // 使用前に newMap などで初期化してから HtmmMap を描画
  root.render(/* あなたのアプリ */);
</script>
```

グローバル変数 `window.htmm` からコンポーネントやフックを取得できます。React / ReactDOM はバンドルに含まれるため、`window.React` と `window.ReactDOM` も利用可能です。

### 基本的な使い方（パッケージ利用時）

```tsx
import { HtmmMap, useHtmmStore } from '@tomk79/htmm';
import { useEffect } from 'react';

function App() {
  const { newMap, addChild } = useHtmmStore();

  useEffect(() => {
    // 新しいマインドマップを作成
    newMap('My Mind Map');
    
    // ルートノードに子を追加
    const store = useHtmmStore.getState();
    if (store.mapData) {
      const rootId = store.mapData.root.id;
      store.addChild(rootId, 'First Topic');
      store.addChild(rootId, 'Second Topic');
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <HtmmMap width="100%" height="100%" />
    </div>
  );
}
```

### .mmファイルの読み込み

```tsx
import { loadMindMapFile } from '@tomk79/htmm';
import { useHtmmStore } from '@tomk79/htmm';

function FileLoader() {
  const { loadMap } = useHtmmStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mapData = await loadMindMapFile(file);
      loadMap(mapData);
    }
  };

  return <input type="file" accept=".mm" onChange={handleFileChange} />;
}
```

### .mmファイルの保存

```tsx
import { saveMindMapFile } from '@tomk79/htmm';
import { useHtmmStore } from '@tomk79/htmm';

function SaveButton() {
  const { mapData } = useHtmmStore();

  const handleSave = () => {
    if (mapData) {
      saveMindMapFile(mapData, 'my-mindmap.mm');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### 1ページに複数マップを配置する

同一ページに、異なる .mm データを持つマップを複数表示する場合は、各 `<HtmmMap />` に **`initialMapData`** を渡してください。各インスタンスが内部で専用のストアを持ち、データ・ズーム・パンなどが独立します。既存の単一マップのコード（`loadMap()` のあと `<HtmmMap />` を 1 つだけマウントする使い方）は変更不要です。

```tsx
import { useState, useEffect } from 'react';
import { HtmmMap, loadMindMapURL } from '@tomk79/htmm';

function MultiMapPage() {
  const [mapData1, setMapData1] = useState(null);
  const [mapData2, setMapData2] = useState(null);

  useEffect(() => {
    loadMindMapURL('/map1.mm').then(setMapData1);
    loadMindMapURL('/map2.mm').then(setMapData2);
  }, []);

  return (
    <div>
      {mapData1 && <HtmmMap initialMapData={mapData1} width="100%" height="400px" />}
      {mapData2 && <HtmmMap initialMapData={mapData2} width="100%" height="400px" />}
    </div>
  );
}
```

### 読み込み専用（ReadOnly）モード

表示専用で編集を禁止したい場合は、**`readOnly`** プロパティを指定してください。読み込み専用モードでは次の操作はできません。

- **できないこと:** ノードの追加・変更・削除、並び替え（ドラッグ＆ドロップ）、カット・ペースト、スタイル変更、Undo/Redo など
- **できること:** ノードの選択、ノードの開閉（折りたたみ）、ズーム・パン、コピー

初期化時にオプションで指定するか、`initialMapData` と組み合わせて利用できます。

```tsx
// 単一マップで読み込み専用
<HtmmMap readOnly width="100%" height="600px" />

// 複数マップのうち1つだけ読み込み専用で表示
{mapData && (
  <HtmmMap initialMapData={mapData} readOnly width="100%" height="400px" />
)}
```

ストアを直接扱う場合は `createHtmmStore({ readOnly: true })` で読み込み専用のストアを作成するか、`useHtmmStore.getState().setReadOnly(true)` で切り替えられます。`HtmmState` / `HtmmActions` の型には `readOnly` と `setReadOnly` が含まれます。

## 主要API

### コンポーネント

#### `<HtmmMap />`

```tsx
<HtmmMap 
  width="100%" 
  height="600px" 
  className="custom-class"
  initialMapData={mapData}  // 省略可。指定するとこのインスタンス専用のストアで複数マップ対応
  readOnly={false}         // 省略可。true にすると編集不可（選択・開閉・ズーム・コピーは可能）
/>
```

### フック

#### `useHtmmStore()`

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

### @tomk79/htmm v0.0.2 (リリース日未定)

- npm のエントリーポイントを修正。
- 公開ファイルリストの不備を修正。
- 複数のマインドマップを配置できるようになった。
- オブジェクト名称の変更。
- 読み込み専用（ReadOnly）モードを追加。`<HtmmMap readOnly />` または `createHtmmStore({ readOnly: true })` で、ノードの追加・変更・削除・並び替え・ペーストなどを無効にしつつ、選択・開閉・ズーム・コピーは利用可能。
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

GNU GPL v2 - FreeMindと同じライセンス

本プロジェクトは [FreeMind](http://freemind.sourceforge.net/) をベースにしています。

## 謝辞

- [FreeMind](http://freemind.sourceforge.net/) - Christian Foltin氏と貢献者の皆様
- [Zustand](https://github.com/pmndrs/zustand) - 状態管理ライブラリ
- [Vite](https://vitejs.dev/) - 高速ビルドツール
- [React](https://react.dev/) - UIフレームワーク
