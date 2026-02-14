# htmm

<div align="center">

**モダンなReactベースのマインドマップライブラリ**

FreeMindのJavaアプリケーションをウェブに移植した、軽量で埋め込み可能なマインドマップUIコンポーネント

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

</div>

---

## ✨ 特徴

- 📖 **FreeMind互換** - `.mm` ファイルの完全な読み書き
- ⚛️ **React製** - モダンなフロントエンド技術
- ⌨️ **キーボードショートカット** - FreeMind互換の操作性
- 🎨 **豊富なスタイリング** - 色、フォント、アイコン、クラウド対応
- 🔗 **リンク・ノート** - 外部リンクやリッチコンテンツ
- 📱 **レスポンシブ** - デスクトップ・モバイル対応
- 🌐 **埋め込み可能** - 任意のウェブサイトに統合

## 🚀 クイックスタート

### インストール

```bash
npm install freemind-web
# または
yarn add freemind-web
# または
pnpm add freemind-web
```

### 基本的な使い方

```tsx
import { FreeMindMap, useFreeMindStore } from 'freemind-web';
import { useEffect } from 'react';

function App() {
  const { newMap, addChild } = useFreeMindStore();

  useEffect(() => {
    // 新しいマインドマップを作成
    newMap('My Mind Map');
    
    // ルートノードに子を追加
    const store = useFreeMindStore.getState();
    if (store.mapData) {
      const rootId = store.mapData.root.id;
      store.addChild(rootId, 'First Topic');
      store.addChild(rootId, 'Second Topic');
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FreeMindMap width="100%" height="100%" />
    </div>
  );
}
```

### .mmファイルの読み込み

```tsx
import { loadMindMapFile } from 'freemind-web';
import { useFreeMindStore } from 'freemind-web';

function FileLoader() {
  const { loadMap } = useFreeMindStore();

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
import { saveMindMapFile } from 'freemind-web';
import { useFreeMindStore } from 'freemind-web';

function SaveButton() {
  const { mapData } = useFreeMindStore();

  const handleSave = () => {
    if (mapData) {
      saveMindMapFile(mapData, 'my-mindmap.mm');
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

## 📘 主要API

### コンポーネント

#### `<FreeMindMap />`

```tsx
<FreeMindMap 
  width="100%" 
  height="600px" 
  className="custom-class"
/>
```

### フック

#### `useFreeMindStore()`

```tsx
const {
  // データ
  mapData,
  selectedNodeIds,
  editable,
  
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
} = useFreeMindStore();
```

### ユーティリティ関数

#### ファイルI/O

```tsx
// 読み込み
const mapData = await loadMindMapFile(file);
const mapData = await loadMindMapURL('https://example.com/map.mm');
const mapData = parseFreeMindXML(xmlString);

// 保存
saveMindMapFile(mapData, 'filename.mm');
const blob = getMindMapBlob(mapData);
const xmlString = generateFreeMindXML(mapData);
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
} from 'freemind-web';

const node = createNode('My Node');
const root = createRootNode('Root');
const found = findNodeById(root, 'ID_123');
const parent = findParentNode(root, 'ID_123');
const cloned = cloneNode(node, true);
```

## ⌨️ キーボードショートカット

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

## 🎨 スタイリング例

```tsx
const { setNodeColor, setNodeBackgroundColor, setFont, setNodeStyle } = useFreeMindStore();

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

## 🏗️ 開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

### ディレクトリ構造

```
freemind-web/
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── store/          # 状態管理 (Zustand)
│   ├── io/             # ファイルI/O
│   ├── layout/         # レイアウトエンジン
│   ├── models/         # ビジネスロジック
│   ├── types/          # TypeScript型定義
│   └── demo/           # デモアプリ
└── public/             # 静的ファイル
```

## 📄 ドキュメント

詳細な設計書・要件定義書は [DESIGN.md](./DESIGN.md) をご覧ください。

## 🤝 貢献

貢献を歓迎します！ Issue や Pull Request をお気軽にお送りください。

## 📝 ライセンス

GNU GPL v2 - FreeMindと同じライセンス

本プロジェクトは [FreeMind](http://freemind.sourceforge.net/) をベースにしています。

## 🙏 謝辞

- [FreeMind](http://freemind.sourceforge.net/) - Christian Foltin氏と貢献者の皆様
- [Zustand](https://github.com/pmndrs/zustand) - 状態管理ライブラリ
- [Vite](https://vitejs.dev/) - 高速ビルドツール
- [React](https://react.dev/) - UIフレームワーク

## 📧 お問い合わせ

質問やフィードバックは [GitHub Issues](https://github.com/your-repo/freemind-web/issues) までお願いします。

---

<div align="center">
Made with ❤️ for the FreeMind community
</div>
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
