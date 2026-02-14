# FreeMind Web - 設計書・要件定義書

## プロジェクト概要

FreeMind Web は、Java製マインドマッピングツール「FreeMind」のデスクトップアプリケーションをウェブ上で動作するReact UIライブラリとして移植したプロジェクです。

### 目的
- 任意のウェブサイトに埋め込み可能なマインドマップUIの提供
- FreeMind形式（.mm）ファイルの完全な読み書きサポート
- FreeMind互換のマインドマップ表現とキーボードショートカット
- モダンなReactエコシステムとの統合

## 技術スタック

### フロントエンド
- **React 19** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - ビルドツール

### 状態管理
- **Zustand 5** - 軽量な状態管理
- **Immer** - イミュータブル更新

### レンダリング方式
- **ハイブリッドアプローチ**:
  - ノード: HTML/CSS (アクセシビリティ、保守性)
  - エッジ: SVG (ベジエ曲線、矢印描画)

## アーキテクチャ設計

### ディレクトリ構造

```
freemind-web/
├── src/
│   ├── types/          # TypeScript型定義
│   │   ├── mindmap.ts  # マインドマップデータ型
│   │   └── actions.ts  # アクション型定義
│   ├── models/         # ビジネスロジック
│   │   └── MindMapNode.ts  # ノード操作関数
│   ├── io/             # ファイルI/O
│   │   ├── parser.ts   # .mm XMLパーサー
│   │   └── generator.ts # .mm XML生成
│   ├── store/          # 状態管理
│   │   └── freemind-store.ts  # Zustandストア
│   ├── layout/         # レイアウトエンジン
│   │   └── layout-engine.ts  # ノード配置計算
│   ├── components/     # Reactコンポーネント
│   │   ├── FreeMindMap.tsx    # ルートコンポーネント
│   │   ├── NodeView.tsx       # ノード描画
│   │   └── EdgeView.tsx       # エッジ描画
│   ├── hooks/          # カスタムフック
│   ├── utils/          # ユーティリティ
│   ├── demo/           # デモアプリケーション
│   │   ├── main.tsx
│   │   └── demo.css
│   └── index.ts        # エントリーポイント
├── public/             # 静的ファイル
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### レイヤー構成

1. **プレゼンテーション層** (components/)
   - React コンポーネント
   - UIイベントハンドリング
   - スタイリング

2. **ビジネスロジック層** (models/, layout/)
   - ノード操作
   - レイアウト計算
   - バリデーション

3. **データ層** (store/, io/)
   - 状態管理
   - ファイルI/O
   - 履歴管理 (Undo/Redo)

4. **型定義層** (types/)
   - TypeScript インターフェース
   - 型ガード

## データモデル設計

### MindMapNode (ノード)

```typescript
interface MindMapNode {
  id: string;                     // 一意識別子
  text?: string;                  // ノードテキスト
  position?: 'left' | 'right';    // ルート直下の子のみ
  folded?: boolean;               // 折りたたみ状態
  color?: string;                 // テキスト色 (#RRGGBB)
  backgroundColor?: string;       // 背景色
  style?: NodeStyle;              // 'bubble' | 'fork' | ...
  link?: string;                  // リンクURL
  created?: number;               // 作成タイムスタンプ
  modified?: number;              // 更新タイムスタンプ
  
  // スタイリング
  font?: FontInfo;
  edge?: EdgeInfo;
  cloud?: CloudInfo;
  
  // レイアウト
  layout?: LayoutInfo;
  
  // コレクション
  icons?: IconInfo[];
  arrowLinks?: ArrowLinkInfo[];
  richContent?: RichContentInfo[];
  attributes?: AttributeInfo[];
  
  // 階層構造
  children?: MindMapNode[];
}
```

### MindMapData (ドキュメント)

```typescript
interface MindMapData {
  version: string;  // FreeMindバージョン (e.g., "1.0.1")
  root: MindMapNode;
}
```

## 主要機能仕様

### 1. ファイルI/O

#### .mm ファイル読み込み
- **パーサー**: DOMParser を使用
- **サポート要素**: `<map>`, `<node>`, `<font>`, `<edge>`, `<cloud>`, `<icon>`, `<arrowlink>`, `<richcontent>`, `<attribute>`
- **エラーハンドリング**: XMLパースエラーの検出と報告

#### .mm ファイル書き出し
- **生成**: XMLSerializer を使用
- **フォーマット**: FreeMind 互換 XML
- **ダウンロード**: Blob API経由でローカル保存

### 2. レイアウトエンジン

#### アルゴリズム
FreeMindの `NodeViewLayout` を再実装:

1. **ルートノード**: 中心 (x: 0, y: 0) に配置
2. **子ノード**: 
   - ルートの子: 左右に振り分け (`position` 属性)
   - 孫以降: 親と同じ側に配置
   - 水平間隔: HGAP (デフォルト 20px)
   - 垂直間隔: VGAP (デフォルト 3px)

3. **サブツリー高さ計算**: 再帰的に全子ノードの高さを合計
4. **中央揃え**: サブツリーの中心を親ノードに揃える

#### 定数

```typescript
const LAYOUT_CONSTANTS = {
  DEFAULT_HGAP: 20,      // 親からの水平間隔
  DEFAULT_VGAP: 3,       // 兄弟間の垂直間隔
  MIN_NODE_WIDTH: 150,   // 最小ノード幅
  MIN_NODE_HEIGHT: 20,   // 最小ノード高さ
  ICON_SIZE: 16,         // アイコンサイズ
  TEXT_PADDING_H: 8,     // 水平パディング
  TEXT_PADDING_V: 4,     // 垂直パディング
};
```

### 3. 状態管理

#### ストア構造

```typescript
interface FreeMindState {
  // データ
  mapData: MindMapData | null;
  selectedNodeIds: Set<string>;
  editable: boolean;
  
  // 履歴 (Undo/Redo)
  history: MindMapData[];
  historyIndex: number;
  maxHistorySize: number;
  
  // ビュー
  zoom: number;
  panX: number;
  panY: number;
  
  // クリップボード
  clipboard: MindMapNode | null;
}
```

#### 主要アクション

**ノード操作**:
- `addChild(parentId, text)` - 子ノード追加
- `addSibling(siblingId, before)` - 兄弟ノード追加
- `deleteNode(nodeId)` - ノード削除
- `editNode(nodeId, text)` - テキスト編集
- `moveNode(nodeId, newParentId, index)` - ノード移動

**スタイリング**:
- `setNodeColor(nodeId, color)` - テキスト色
- `setNodeBackgroundColor(nodeId, color)` - 背景色
- `setFont(nodeId, font)` - フォント設定
- `setNodeStyle(nodeId, style)` - ノードスタイル

**折りたたみ**:
- `toggleFolded(nodeId)` - 折りたたみ切替
- `foldAll()` - 全て折りたたむ
- `unfoldAll()` - 全て展開

**履歴**:
- `undo()` - 元に戻す
- `redo()` - やり直し

### 4. コンポーネント設計

#### FreeMindMap (ルート)

```tsx
<FreeMindMap 
  width="100%" 
  height="600px" 
  className="custom-class"
/>
```

**責務**:
- レイアウト計算の orchestration
- エッジリストの構築
- SVGレイヤーとHTMLレイヤーの管理

#### NodeView (ノード)

**機能**:
- テキスト表示/編集 (contentEditable)
- アイコン表示
- 折りたたみシンボル
- クラウド描画
- クリック選択
- ダブルクリック編集

**スタイル適用**:
- Fork style (デフォルト)
- Bubble style (角丸)
- Root style (グラデーション)

#### EdgeView (エッジ)

**エッジスタイル**:
1. **Linear**: 直線
2. **Bezier**: ベジエ曲線 (滑らかな曲線)
3. **Sharp Linear**: 直角パス
4. **Sharp Bezier**: 直角パス + 角丸

**SVG Path生成**: CubicCurve2Dアルゴリズムを再実装

### 5. キーボードショートカット

FreeMindの主要ショートカットを計画:

| ショートカット | アクション |
|--------------|----------|
| Tab | 子ノード追加 |
| Enter | 兄弟ノード追加 |
| Shift+Enter | 前の兄弟追加 |
| Delete | ノード削除 |
| Space | 折りたたみ切替 |
| Ctrl+Z / Cmd+Z | Undo |
| Ctrl+Y / Cmd+Y | Redo |
| Ctrl+C / Cmd+C | コピー |
| Ctrl+X / Cmd+X | カット |
| Ctrl+V / Cmd+V | ペースト |
| Ctrl+B / Cmd+B | 太字切替 |
| Ctrl+I / Cmd+I | イタリック切替 |

### 6. リッチテキスト編集

#### サポート範囲
- **基本フォーマット**: 太字、斜体、取り消し線、下線
- **色**: テキスト色、背景色
- **フォント**: サイズ、ファミリー

#### 実装方式
- `contentEditable` による直接編集
- `<richcontent TYPE="NODE">` のHTML形式での保存
- 簡易ツールバー (将来拡張可能)

## 非機能要件

### パフォーマンス
- **目標**: 1000ノード規模のマップで60FPS維持
- **最適化手法**:
  - React.memo によるノードの再レンダリング制御
  - 仮想化 (将来実装)
  - レイアウト計算のキャッシュ

### アクセシビリティ
- キーボード操作完全対応
- ARIA属性の適切な設定
- スクリーンリーダー対応

### ブラウザ互換性
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### セキュリティ
- XSS対策: DOMPurify導入検討 (リッチコンテンツ)
- CSP対応

## 制約事項・将来課題

### 現在の制約
1. **プラグインシステム**: FreeMindのプラグインは非対応
   - 理由: Java動的ロードの複雑さ
   - 対策: 主要プラグイン機能を組み込み機能として再実装検討

2. **完全なHTML編集**: リッチテキストは基本機能のみ
   - 対策: TinyMCE/Quill統合を将来検討

3. **ファイルロック**: 複数ユーザー同時編集は未対応
   - 対策: WebSocket + CRDT による協調編集を将来検討

### 拡張計画
1. **Phase 1** (完了): ビューア + 基本編集
2. **Phase 2** (完了): フルスタイリング + リンク + アイコン
3. **Phase 3** (完了): エクスポート (PNG, SVG, PDF) + 印刷
4. **Phase 4** (計画): 協調編集（WebSocket / CRDT / 複数ユーザー同時編集）
5. **Phase 5** (完了): モバイル最適化 — ダブルタップ編集、タッチジェスチャー（ピンチズーム・パン）、モバイル専用UI（タップターゲット拡大・フローティングズーム）を実装済み。

## FreeMind互換性マトリックス

| 機能 | FreeMind | FreeMind Web | 備考 |
|-----|---------|-------------|------|
| .mmファイル読込 | ✅ | ✅ | 完全互換 |
| .mmファイル書出 | ✅ | ✅ | 完全互換 |
| ノード追加/削除/編集 | ✅ | ✅ | |
| 折りたたみ | ✅ | ✅ | |
| スタイリング | ✅ | ✅ | |
| アイコン | ✅ | ✅ | emoji マッピング + NodeView 表示 |
| リンク | ✅ | ✅ | ノード link 属性 + ArrowLink |
| クラウド | ✅ | ✅ | SVG描画 |
| リッチテキスト | ✅ | 🔶 | 基本機能のみ |
| プラグイン | ✅ | ❌ | 非対応 |
| エクスポート | ✅ | ✅ | PNG / SVG / PDF |
| 印刷 | ✅ | ✅ | print.css + printMap 等 |

凡例: ✅ 実装済み | 🔶 部分対応 | 🔲 計画中 | ❌ 非対応

## API リファレンス

### 公開コンポーネント

#### FreeMindMap

```tsx
interface FreeMindMapProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}
```

### 公開フック

#### useFreeMindStore

```tsx
const {
  mapData,
  addChild,
  editNode,
  undo,
  redo,
  // ...
} = useFreeMindStore();
```

### 公開関数

#### ファイルI/O

```tsx
// 読み込み
const data = await loadMindMapFile(file);
const data = await loadMindMapURL(url);
const data = parseFreeMindXML(xmlString);

// 書き出し
saveMindMapFile(data, 'map.mm');
const blob = getMindMapBlob(data);
const xml = generateFreeMindXML(data);
```

#### ノード操作

```tsx
const node = createNode('Text');
const root = createRootNode('Root');
const found = findNodeById(root, 'ID_123');
const parent = findParentNode(root, 'ID_123');
const cloned = cloneNode(node, true);
```

## テスト計画

### ユニットテスト
- データモデル (MindMapNode.ts) — 実施済み
- XMLパーサー/ジェネレーター — 実施済み
- レイアウトエンジン — 実施済み（layout-engine.test.ts）
- 状態管理アクション — 実施済み（freemind-store.test.ts）

### 統合テスト
- ファイル読込 → レイアウト → レンダリング
- 編集操作 → Undo/Redo
- ノード移動 → 再レイアウト

### E2Eテスト (Playwright)
- キーボードショートカット動作
- ドラッグ&ドロップ
- ファイル読込/保存

### 互換性テスト
- FreeMindで作成した.mmファイルを読込
- FreeMind Webで編集した.mmファイルをFreeMindで開く

## ビルド・デプロイ

### 開発
```bash
npm run dev  # 開発サーバー起動
```

### ビルド
```bash
npm run build  # ライブラリビルド (ES + UMD)
```

### 配布
- npm パッケージ: `freemind-web`
- CDN: unpkg, jsdelivr

## ライセンス

GNU GPL v2 (FreeMind互換)

## 参考資料

- [FreeMind公式サイト](http://freemind.sourceforge.net/)
- [freemind.xsd](../freemind/freemind.xsd) - XMLスキーマ定義
- [FreeMind Javaソースコード](../freemind/freemind/) - 元実装

## 変更履歴

- **2026-02-14**: 初版作成、基本実装完了
