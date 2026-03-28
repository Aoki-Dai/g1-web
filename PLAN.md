# Unitree G1 Web制御システム 実装計画

## Context

Unitree G1ロボットをWebブラウザから操作するシステムを構築する。まずモック（実機不要）のFastAPIバックエンドを作り、別PCからネットワーク越しに検証可能にする。その後Vue.jsフロントエンドを追加し、最終的にunitree_sdk2pyで実機制御に接続する。

## アーキテクチャ

```
frontend/ (Vue 3 + TypeScript + Vite)
  ↕ REST API + WebSocket
main.py (FastAPI)
  └── app/
      ├── api/         ... エンドポイント
      ├── models/      ... Pydanticスキーマ
      ├── services/    ... ロボット制御層
      │   ├── robot_controller.py  (ABC)
      │   ├── mock_controller.py   (モック実装)
      │   └── g1_controller.py     (実機・将来)
      └── config.py    ... 設定
```

**コントローラ切替**: 環境変数 `ROBOT_MODE=mock|real` で切替。FastAPIのlifespanで初期化。

---

## Step 1: Python依存関係 & ディレクトリ構造

**pyproject.toml** に追加:
```
fastapi>=0.115.0, uvicorn[standard]>=0.30.0, websockets>=12.0, pydantic>=2.0
```

ディレクトリ作成:
```
app/__init__.py
app/config.py
app/models/__init__.py, schemas.py
app/services/__init__.py, robot_controller.py, mock_controller.py, g1_controller.py
app/api/__init__.py, robot.py, locations.py, websocket.py, deps.py
```

`uv sync` で依存関係インストール。

## Step 2: Pydanticモデル (`app/models/schemas.py`)

- `RobotStatus` (enum): IDLE, MOVING, ARRIVED, ERROR, EMERGENCY_STOPPED
- `Position`: x, y, theta
- `Location`: id, name, name_ja, position
- `RobotState`: status, current_position, current_location, target_location, battery_level, message
- `MoveCommand`: location_id
- `MoveResponse`: success, message, task_id

## Step 3: 設定 (`app/config.py`)

Pydantic BaseSettingsで環境変数から読み込み:
- `ROBOT_MODE: str = "mock"`
- `HOST: str = "0.0.0.0"` (LAN内アクセス用)
- `PORT: int = 8000`
- `CORS_ORIGINS: list[str] = ["*"]`
- `MOCK_MOVE_DURATION: float = 5.0` (移動シミュレーション秒数)

定義済みロケーション:
- kitchen (キッチン): (3.0, 1.0, 0.0)
- table (テーブル): (1.5, 2.5, 1.57)
- toilet (トイレ): (0.0, 4.0, 3.14)

## Step 4: コントローラ抽象クラス & モック実装

**`robot_controller.py`** (ABC):
- `initialize()`, `shutdown()`, `move_to_location(location_id)`, `stop()`, `get_state()`
- `set_state_callback(callback)` — 状態変化をWebSocketへ通知するためのコールバック

**`mock_controller.py`**:
- 内部状態: position, status, current_location (初期値="table"), battery
- `move_to_location()`: asyncio.Taskで位置を補間しながら移動をシミュレート (5秒間)
- 移動中は各ステップでコールバック呼び出し → WebSocket経由でリアルタイム更新
- `stop()`: 移動タスクをキャンセル、EMERGENCY_STOPPED状態に
- asyncio.Lockで排他制御

## Step 5: APIエンドポイント

- `GET /api/locations` — ロケーション一覧
- `GET /api/robot/status` — ロボット状態取得
- `POST /api/robot/move` — 移動コマンド送信 (`{location_id: "kitchen"}`)
- `POST /api/robot/stop` — 緊急停止
- `WS /ws/robot/status` — リアルタイム状態配信

## Step 6: main.py統合

- FastAPI lifespan でコントローラ初期化/終了
- CORSミドルウェア設定
- ルーター登録
- `0.0.0.0:8000` でバインド

**ここで別PCからcurlで全API検証可能**

## Step 7: Vue.jsフロントエンド

`bun create vue@latest frontend` (TypeScript, Vite)

### コンポーネント:
- **`useRobot.ts`** (composable): WebSocket接続・自動再接続、API呼び出し、リアクティブ状態管理
- **`LocationButton.vue`**: 大きなタッチ対応ボタン (日本語ラベル表示)
- **`ConfirmDialog.vue`**: 移動確認ダイアログ
- **`RobotStatusBar.vue`**: 状態表示 (現在地、移動中、バッテリー)
- **`EmergencyStop.vue`**: 常時表示の緊急停止ボタン（赤）

### Vite設定:
- `/api` → `http://localhost:8000` プロキシ
- `/ws` → `ws://localhost:8000` WebSocketプロキシ

## Step 8: ビルド統合

FastAPIから`frontend/dist`を静的ファイルとして配信 → 本番は単一サーバーで動作。
**注意**: `app.mount("/", ...)` はAPIルーター登録後に配置。

---

## 検証手順

1. `uv run python main.py` でサーバー起動
2. 別PCから `curl http://<IP>:8000/api/locations` → ロケーション一覧取得
3. `curl http://<IP>:8000/api/robot/status` → IDLE状態確認
4. `curl -X POST http://<IP>:8000/api/robot/move -H "Content-Type: application/json" -d '{"location_id":"kitchen"}'` → 移動開始
5. WebSocket接続でリアルタイム状態変化を確認
6. フロントエンド: `http://<IP>:8000` でUI操作 → ボタン押下 → 確認 → 移動 → 状態更新

## 主要ファイル一覧

| ファイル | 役割 |
|---------|------|
| `main.py` | FastAPIエントリポイント、CORS、ルーター統合 |
| `app/services/robot_controller.py` | コントローラABC（インターフェース定義） |
| `app/services/mock_controller.py` | モック実装（非同期状態マシン） |
| `app/models/schemas.py` | 共有Pydanticモデル |
| `app/api/robot.py` | ロボット制御REST API |
| `app/api/websocket.py` | WebSocketリアルタイム配信 |
| `frontend/src/composables/useRobot.ts` | Vue側の状態管理・API通信 |
| `frontend/src/App.vue` | メインUI |
