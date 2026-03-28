# G1 Web Controller - フロントエンド実装まとめ

## 概要

Unitree G1ロボットをWebブラウザから操作するためのVue.jsフロントエンド。
行き先ボタンを押して確認するだけのシンプルなUIで、WebSocketによるリアルタイム状態表示に対応。

## 技術スタック

- **Vue 3** (Composition API)
- **TypeScript**
- **Vite** (ビルド + 開発サーバー)
- **Bun** (パッケージマネージャー)
- CSSのみ（外部UIフレームワークなし）

## ディレクトリ構成

```text
frontend/
├── index.html                      # エントリHTML
├── package.json                    # 依存関係・スクリプト
├── vite.config.ts                  # Vite設定（プロキシ含む）
├── tsconfig.json                   # TypeScript設定
├── tsconfig.node.json              # Vite用TypeScript設定
├── env.d.ts                        # Vite/Vue型宣言
└── src/
    ├── main.ts                     # Vueアプリ初期化
    ├── App.vue                     # メインレイアウト
    ├── style.css                   # グローバルスタイル
    ├── types.ts                    # TypeScript型定義
    ├── composables/
    │   └── useRobot.ts             # 状態管理・API通信・WebSocket
    └── components/
        ├── RobotStatusBar.vue      # ステータスバー
        ├── LocationButton.vue      # 行き先ボタン
        ├── ConfirmDialog.vue       # 確認ダイアログ
        └── EmergencyStop.vue       # 緊急停止ボタン
```

## 画面構成

```text
┌────────────────────────┐
│    G1 Web Controller   │  ← ヘッダー
├────────────────────────┤
│ [待機中]      接続中    │  ← ステータスバー
│ 現在地: テーブル        │
│ ████████████████ 100%  │  ← バッテリー
├────────────────────────┤
│ 行き先を選択            │
│                        │
│ ┌────────────────────┐ │
│ │    キッチン          │ │  ← 行き先ボタン
│ │    Kitchen          │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │    テーブル  [現在地] │ │  ← 現在地にはバッジ表示
│ │    Table            │ │
│ └────────────────────┘ │
│ ┌────────────────────┐ │
│ │    トイレ            │ │
│ │    Toilet           │ │
│ └────────────────────┘ │
│                        │
├────────────────────────┤
│      緊急停止           │  ← 画面下部に固定（赤）
└────────────────────────┘
```

## コンポーネント詳細

### `useRobot.ts` (Composable)

ロボット制御のロジックを一箇所に集約。全コンポーネントから共有される。

| プロパティ/関数 | 型 | 説明 |
| --- | --- | --- |
| `robotState` | `Ref<RobotState>` | WebSocketで受信したリアルタイム状態 |
| `locations` | `Ref<Location[]>` | バックエンドから取得したロケーション一覧 |
| `isConnected` | `Ref<boolean>` | WebSocket接続状態 |
| `sendMove(locationId)` | `Promise<MoveResponse>` | 移動コマンド送信 |
| `sendStop()` | `Promise<MoveResponse>` | 緊急停止コマンド送信 |

WebSocket接続は自動再接続付き（指数バックオフ、最大5秒間隔）。

### `RobotStatusBar.vue`

ロボットの現在状態を表示するバー。

- 状態バッジ（色分け）: 緑=待機中、青=移動中、オレンジ=到着、赤=エラー/緊急停止
- 現在地・移動先の表示
- バッテリー残量バー
- WebSocket接続状態インジケータ

### `LocationButton.vue`

行き先を選択するボタン。

- 日本語名を大きく、英語名を小さく表示
- 現在地のボタンには「現在地」バッジ
- 移動中は全ボタンdisabled（誤操作防止）
- タッチ操作対応（最小高さ120px）

### `ConfirmDialog.vue`

移動前の確認モーダル。

- 「ロボットを○○に移動しますか？」メッセージ
- 「キャンセル」「移動する」ボタン
- オーバーレイクリックでもキャンセル可能

### `EmergencyStop.vue`

常時表示の緊急停止ボタン。

- 画面下部にsticky配置
- 赤色で目立つデザイン
- 確認ダイアログなし（即座に停止）

## Viteプロキシ設定

開発時、フロントエンド(5173)からバックエンド(8000)へリクエストを転送:

| パス | 転送先 | 用途 |
| --- | --- | --- |
| `/api/*` | `http://localhost:8000` | REST API |
| `/ws/*` | `ws://localhost:8000` | WebSocket |

## TypeScript型定義

バックエンドのPydanticモデルに1対1で対応:

| TypeScript | Python (Pydantic) | 用途 |
| --- | --- | --- |
| `RobotStatus` | `RobotStatus` | ロボット状態 (idle/moving/arrived/error/emergency_stopped) |
| `Position` | `Position` | 座標 (x, y, theta) |
| `Location` | `Location` | ロケーション情報 (id, name, name_ja, position) |
| `RobotState` | `RobotState` | ロボット全体状態 |
| `MoveResponse` | `MoveResponse` | 移動コマンドの応答 |

## 操作フロー

1. 画面を開くと、WebSocketで接続しロボットの現在状態を取得
2. 行き先ボタン（キッチン/テーブル/トイレ）を押す
3. 確認ダイアログで「移動する」を押す
4. バックエンドに `POST /api/robot/move` を送信
5. WebSocketで状態がリアルタイム更新（IDLE → MOVING → ARRIVED → IDLE）
6. 移動中はボタンが無効化される
7. 緊急停止ボタンは常時有効

## 起動方法

```bash
# バックエンド（別ターミナル）
uv run python main.py

# フロントエンド開発サーバー
cd frontend
bun install    # 初回のみ
bun run dev
```

ブラウザで `http://localhost:5173` を開く。

## 本番ビルド

```bash
cd frontend
bun run build
```

ビルド結果は `frontend/dist/` に出力され、FastAPI側 (`main.py`) が自動的に静的ファイルとして配信する。
本番時は `http://localhost:8000` のみでフロントエンド+バックエンドが一体で動作する。
