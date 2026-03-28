# G1 Web Controller - バックエンド実装まとめ

## 概要

Unitree G1ロボットをWebから制御するためのFastAPIバックエンド。
モックコントローラにより、**実機なしで別PCからネットワーク越しに動作検証可能**。

## ディレクトリ構成

```text
g1-web/
├── main.py                          # FastAPIエントリポイント
├── pyproject.toml                   # Python依存関係
├── app/
│   ├── config.py                    # 設定（環境変数対応）
│   ├── models/
│   │   └── schemas.py               # Pydanticモデル定義
│   ├── api/
│   │   ├── deps.py                  # 依存性注入（コントローラ管理）
│   │   ├── robot.py                 # ロボット制御エンドポイント
│   │   ├── locations.py             # ロケーションエンドポイント
│   │   └── websocket.py            # WebSocketリアルタイム配信
│   └── services/
│       ├── robot_controller.py      # 抽象基底クラス（ABC）
│       ├── mock_controller.py       # モック実装（実機不要）
│       └── g1_controller.py         # 実機用スタブ（将来実装）
```

## 技術スタック

- **Python 3.11** + **uv** (パッケージ管理)
- **FastAPI** - REST API + WebSocket
- **Pydantic v2** - データバリデーション
- **pydantic-settings** - 環境変数から設定読み込み
- **uvicorn** - ASGIサーバー

## APIエンドポイント一覧

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/api/health` | ヘルスチェック（動作モード表示） |
| GET | `/api/locations` | ロケーション一覧取得 |
| GET | `/api/robot/status` | ロボット状態取得 |
| POST | `/api/robot/move` | 移動コマンド送信 |
| POST | `/api/robot/stop` | 緊急停止 |
| WS | `/ws/robot/status` | リアルタイム状態配信 |

## コントローラアーキテクチャ

環境変数 `ROBOT_MODE` で切替（デフォルト: `mock`）。

```text
RobotController (ABC)
├── MockRobotController  ← ROBOT_MODE=mock（デフォルト）
└── G1RobotController    ← ROBOT_MODE=real（将来実装）
```

### 抽象インターフェース

| メソッド | 説明 |
| --- | --- |
| `initialize()` | コントローラ初期化 |
| `shutdown()` | コントローラ終了処理 |
| `move_to_location(location_id)` | 指定ロケーションへ移動 |
| `stop()` | 緊急停止 |
| `get_state()` | 現在の状態取得 |
| `set_state_callback(callback)` | 状態変化時のコールバック設定 |

### モックコントローラの挙動

- 初期位置: テーブル (1.5, 2.5)
- 移動: 5秒かけて位置を補間（0.1秒ごとに更新）
- 移動完了後: ARRIVED → 2秒後に IDLE へ自動遷移
- バッテリー: 移動距離に応じて減少
- 緊急停止: 移動タスクをキャンセル、1秒後にIDLEへ復帰
- WebSocket: 状態変化ごとに全接続クライアントへブロードキャスト

## 定義済みロケーション

| ID | 日本語名 | 座標 (x, y, theta) |
| --- | --- | --- |
| `kitchen` | キッチン | (3.0, 1.0, 0.0) |
| `table` | テーブル | (1.5, 2.5, 1.57) |
| `toilet` | トイレ | (0.0, 4.0, 3.14) |

## 設定項目（環境変数）

| 変数名 | デフォルト | 説明 |
| --- | --- | --- |
| `ROBOT_MODE` | `mock` | コントローラモード（`mock` / `real`） |
| `HOST` | `0.0.0.0` | バインドアドレス |
| `PORT` | `8000` | ポート番号 |
| `CORS_ORIGINS` | `["*"]` | CORS許可オリジン |
| `MOCK_MOVE_DURATION` | `5.0` | モック移動時間（秒） |
| `MOCK_BATTERY_DRAIN_RATE` | `0.5` | バッテリー消耗率（移動距離あたり） |
| `WS_BROADCAST_INTERVAL` | `0.5` | WebSocket配信間隔（秒） |

## 起動方法

```bash
# 依存関係インストール
uv sync

# サーバー起動（モックモード）
uv run python main.py

# または uvicorn 直接実行
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 動作確認（curl）

```bash
# ヘルスチェック
curl http://localhost:8000/api/health
# → {"status":"ok","mode":"mock"}

# ロケーション一覧
curl http://localhost:8000/api/locations
# → {"locations":[{"id":"kitchen","name":"Kitchen","name_ja":"キッチン",...}, ...]}

# ロボット状態確認
curl http://localhost:8000/api/robot/status
# → {"status":"idle","current_position":{"x":1.5,"y":2.5,"theta":1.57},"current_location":"table",...}

# キッチンへ移動
curl -X POST http://localhost:8000/api/robot/move \
  -H "Content-Type: application/json" \
  -d '{"location_id":"kitchen"}'
# → {"success":true,"message":"Moving to キッチン","task_id":"..."}

# 緊急停止
curl -X POST http://localhost:8000/api/robot/stop
# → {"success":true,"message":"Emergency stop executed","task_id":null}
```

## 別PCからの検証

サーバーは `0.0.0.0` でバインドされるため、同一LAN内の別PCからアクセス可能。

```bash
# サーバーのIPアドレスを確認
ifconfig en0 | grep inet

# 別PCからアクセス
curl http://<サーバーIP>:8000/api/health
```

macOSの場合、初回起動時にファイアウォールの許可ダイアログが表示される場合があります。

## 次のステップ

- [ ] Vue.jsフロントエンド作成（Step 7-8）
- [ ] `g1_controller.py` に unitree_sdk2py を使った実機制御を実装
- [ ] ROS2 + SLAM + Navigation 統合
