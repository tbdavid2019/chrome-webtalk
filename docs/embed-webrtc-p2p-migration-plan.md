# Embed 回復 WebRTC P2P＋Artico Signaling 施工規劃

日期：2026-07-16
狀態：待施工

## 結論

單一 `webtalk.js` Embed 可以在每個瀏覽器中建立 WebRTC P2P 連線，並透過 Artico signaling 找到同一聊天室的其他 peer。

Embed 不需要依賴 Vercel WebSocket、Redis、AWS 或 Cloudflare 才能傳送聊天訊息；但 WebRTC 仍需要 Artico signaling 服務交換 SDP／ICE candidate。signaling 只負責「找到人與建立連線」，聊天訊息建立連線後直接走瀏覽器之間的 WebRTC DataChannel。

本次施工的目標是讓 Embed 與 Chrome Extension 共用同一套 P2P room 核心：

```text
Embed A ───────── WebRTC DataChannel ───────── Embed B
    \                                             /
     └──── Artico signaling：只交換連線建立資訊 ────┘
```

## 為什麼要撤回 Vercel WebSocket relay

目前的 Vercel relay 是錯誤的部署模型：Vercel WebSocket 連線會固定在某個 Function instance。A 與 B 若被分到不同 instance，沒有 Redis／Durable Object 時，兩邊的記憶體狀態互相看不到，因此 A 傳出的訊息不會到 B。

這不是前端彈幕事件的問題，也不是 reload 才觸發 UI 的問題；是傳輸層根本沒有把訊息送到 B。

本規劃因此撤回以下設計：

- Website Embed 透過 `/api/webtalk/ws` 廣播公開訊息。
- `REDIS_URL` 作為聊天必要環境變數。
- Embed 的公開訊息與 Extension 使用不同傳輸層。
- 以 Vercel Function 記憶體保存連線集合。

## 不可改變的邊界

### Extension

Extension 的既有邏輯維持不變：

- `ChatRoomImpl` 維持以 `document.location.host` 建立房間。
- `Peer` 維持 `Artico`＋`SocketSignaling`。
- 訊息維持走 WebRTC DataChannel。
- 不新增 relay endpoint，也不改 Extension 的 manifest 行為。

### Embed

Embed 改為直接呼叫相同的 `createChatRoomImpl()`，只提供 Embed 自己的 room identity 選項：

- `scope: meta`、`origin`、`path` 與 `roomId` 規則維持現有文件。
- 同一聊天室的每個 Embed 必須解析出完全相同的 room ID。
- `meta` scope 下，所有合作網站頁面必須提供相同的 `meta[name="webtalk-page-id"]` 值。
- Embed 不應以自身 script URL、每次 mount 時間或隨機值當作 room ID。

## 目前程式核心

施工前先理解以下檔案，不要重新發明第二套 room protocol：

| 檔案 | 職責 |
|---|---|
| `src/domain/impls/Peer.ts` | 建立 Artico peer 與 signaling instance |
| `src/domain/impls/DeterministicRoom.ts` | 依 peer ID 決定唯一發起方，避免雙方重複建立 call |
| `src/domain/impls/BaseRoom.ts` | 加入／離開房間、送訊息、訊息排隊與 WebRTC room 事件轉接 |
| `src/domain/impls/ChatRoom.ts` | 將 room identity 建立成 `ChatRoom` extern |
| `src/utils/roomId.ts` | Embed 房間 ID 的 scope、page ID 與 site ID 規則 |
| `src/domain/ChatRoom.ts` | 將收到的 `RoomMessage` 轉成列表更新、彈幕與其他 domain event |
| `src/app/embed/main.tsx` | Embed mount、storage、UI 與 room 建立入口 |

## 施工順序

每個 task 完成後先測試，再進入下一個 task。不要一次重寫整個聊天核心。

### Task 1：定義 Embed 與 Extension 共用的 P2P contract

**目標：** 確認 Embed 與 Extension 都只透過 `BaseRoom`／`DeterministicRoom` 使用 Artico P2P。

**工作：**

- 移除 `ChatRoomFactoryOptions.relayEndpoint`。
- `createChatRoomImpl()` 不再建立 `WebSocketRelay`。
- `BaseRoom` 移除 `relay` 欄位、relay connect／close、relay send 與 relay receive 分支。
- `ChatRoomImpl` 與 Embed 都使用同一個 `BaseRoom` WebRTC send／receive path。
- `WebTalkEmbedOptions` 移除 `relayEndpoint` 與 `data-webtalk-relay-endpoint` 支援。

**驗收：**

- `rg` 搜尋 Embed、ChatRoom、BaseRoom、build output，不再出現 `WebSocketRelay` 或 `/api/webtalk/ws`。
- Extension 與 Embed 的公開訊息都會進入 `DeterministicRoom.send()`。
- 指定 peer 的 private message 行為不變。

**可能修改檔案：**

- `src/domain/impls/BaseRoom.ts`
- `src/domain/impls/ChatRoom.ts`
- `src/app/embed/main.tsx`
- `src/domain/impls/WebSocketRelay.ts`（刪除）
- `src/domain/impls/WebSocketRelay.test.ts`（刪除或改成 P2P contract test）
- `package.json`
- `pnpm-lock.yaml`

### Task 2：先驗證 room identity，不要先測 UI

**目標：** 排除 A、B 實際上加入不同房間的問題。

**工作：**

- 使用兩個獨立 browser context，設定相同 `origin`、相同 pathname 與相同 `meta[name="webtalk-page-id"]`。
- 由兩邊印出 `chatRoom.value.roomId`，確認完全相同。
- 測試以下情境：
  - 相同 page ID → 同一房間。
  - 不同 page ID → 不同房間。
  - `scope="origin"` → 同站頁面共用房間。
  - explicit `roomId` → 優先於其他 identity 選項。
- 確認合作網站嵌入的 `webtalk.js` 不是用合作網站自己的 script URL 產生 room ID。

**驗收：**

- 相同房間兩個 browser context 都收到 Artico signaling 的 room join event。
- 不同房間完全收不到彼此的 peer join event。
- 這組測試不使用 reload 來判斷成功。

**可能修改檔案：**

- `src/utils/roomId.ts`
- `src/utils/roomId.test.ts`
- `src/app/embed/options.test.ts`
- `src/domain/impls/DeterministicRoom.test.ts`

### Task 3：驗證 WebRTC call 建立與 ready 狀態

**目標：** 確認 signaling 找到 peer 後，只有一方發起 call，另一方正確 answer，雙方都進入 ready。

**工作：**

- 保留 `shouldInitiateRoomCall()` 的 deterministic 規則。
- 保留 call metadata 的 `type: "webtalk-room"` 與 room ID 驗證。
- 驗證同一 peer pair 不會因為 join event 重複而建立兩條 call。
- 驗證 disconnect 後 `DeterministicRoom` 清除 call、ready peer 與事件 listener。
- 驗證重新加入同一房間可以建立新的 call。
- 若 `@rtco/client` 的 public API 支援設定 ICE servers，再確認 STUN／TURN 設定入口；不可自行猜測不存在的 API。

**驗收：**

- A、B 在沒有 reload 的情況下進入 ready。
- A 與 B 只建立一條對應的 WebRTC call。
- A 離開後 B 收到 leave；A 再加入後 B 收到新的 join。
- signaling 斷線時 UI 不得把舊 peer 當作仍然可傳送。

**可能修改檔案：**

- `src/domain/impls/DeterministicRoom.ts`
- `src/domain/impls/DeterministicRoom.test.ts`
- `src/domain/impls/roomLifecycle.ts`
- `src/domain/impls/roomLifecycle.test.ts`

### Task 4：驗證訊息排隊與即時接收

**目標：** 解決「A 先送、B 還沒 ready，所以 B 永遠收不到」的真正 P2P race condition。

**工作：**

- A 在 B 尚未 ready 時送出的公開訊息，必須進入 pending queue。
- B 的 call 觸發 `open`／join 後，pending message 必須送出。
- 每個 peer 的 queue 必須分開管理，不能用一個全域 queue 混送。
- send retry 失敗時不得無限重試；超過上限要保留可診斷錯誤。
- `BaseRoom.onMessage()` 必須在 room message 到達時只註冊一次有效 callback。
- `ChatRoomDomain` 收到 WebRTC 訊息後，必須走現有 `OnTextMessageEvent`，不要另外做一套彈幕更新。
- 既有 message ID 去重必須保留，避免 retry 或多 peer 收到同一訊息時出現重複彈幕。

**驗收：**

- A 傳送文字後，B 不 reload 即在訊息列表看到。
- B 的 danmaku callback 在收到訊息的同一事件鏈觸發。
- B 的畫面會出現彈幕，不需要 polling、不需要 reload、不需要重新 mount。
- A、B、C 三個瀏覽器同時在房間內時，B 與 C 都收到一次。
- A 在 B 尚未 ready 時送出的訊息，B ready 後仍能收到一次。

**可能修改檔案：**

- `src/domain/impls/BaseRoom.ts`
- `src/domain/impls/pendingMessages.ts`
- `src/domain/impls/pendingMessages.test.ts`
- `src/domain/ChatRoom.ts`
- `src/domain/ChatRoom.test.ts`（若目前沒有，新增 domain-level test）

### Task 5：驗證歷史同步與無痕視窗

**目標：** 確認新加入的 Embed 可以從既有 P2P peer 補歷史，而不是誤把瀏覽器本機 IndexedDB 當作即時傳輸。

**工作：**

- 新 peer 加入時，由既有 peer 透過 WebRTC DataChannel 推送設定範圍內的歷史訊息。
- 歷史訊息與即時訊息使用相同 protocol parser。
- 歷史補送不可觸發重複彈幕；歷史載入只更新訊息列表，或依產品既有定義觸發一次 UI 呈現。
- 無痕視窗沒有原本 IndexedDB 時，必須在另一個已在線 peer 存在的前提下收到歷史。
- 如果房間內沒有任何在線 peer，P2P 架構無法保證取得過去訊息；這是設計限制，必須在 UI／文件寫清楚。

**驗收：**

- A 先發送訊息。
- B 以無痕視窗加入同一 room，不 reload。
- B 從在線的 A 收到歷史訊息。
- B 不會因歷史同步把同一訊息重複顯示或重複彈幕。
- 關閉 A 後，新的 C 不得被承諾一定能取得 A 的歷史。

**可能修改檔案：**

- `src/domain/ChatRoom.ts`
- 歷史同步相關 protocol／domain 檔案
- `docs/web-embed.md`

### Task 6：移除錯誤的 Vercel relay 依賴

**目標：** 讓部署不再需要 Redis，也不讓未來維護者誤以為 Vercel WebSocket 是 Embed 的必要服務。

**工作：**

- 刪除 `api/webtalk/ws.ts`。
- 移除 `express`、`ioredis`、`ws`、`@types/express`、`@types/ws` 及只為 relay 加入的依賴。
- 若 `@vercel/functions` 沒有其他使用者，移除它；先用 `rg` 確認。
- 移除 Vercel `REDIS_URL` 部署說明。
- 將 Vercel 文件改回：Vercel 只提供 Embed 靜態 bundle 與 AI proxy；聊天訊息走 Artico WebRTC DataChannel。
- 更新 `CHANGELOG.md`，記錄回復 P2P 的原因與已知限制。
- 版本號依專案 release 規則遞增。

**驗收：**

- Build output 不包含 relay endpoint 字串。
- Vercel Production 不需要 `REDIS_URL` 才能讓聊天建立 P2P。
- Extension 與 Embed 都仍使用 Artico signaling。
- `pnpm install --frozen-lockfile` 成功。

**可能修改檔案：**

- `api/webtalk/ws.ts`（刪除）
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `docs/deploy-vercel.md`
- `docs/web-embed.md`
- `CHANGELOG.md`

## 端到端驗收矩陣

不可用以下方式當作成功：

- 只看 A 自己的畫面。
- 只 reload B 後確認歷史出現。
- 只確認本機 IndexedDB 有資料。
- 只用同一個 browser tab 的 mock WebSocket。

必須使用至少兩個真正獨立的瀏覽器 context；最終使用三個：

| 情境 | A | B | C | 預期 |
|---|---|---|---|---|
| 即時公開訊息 | 正常視窗 | 無痕視窗 | — | B 不 reload 立即看到並出現彈幕 |
| 三人廣播 | 正常視窗 | 無痕視窗 | 第二個瀏覽器 | B、C 各收到一次 |
| late join history | 先在線 | 先發訊息後加入 | — | B 從 A 補到歷史 |
| 不同 room | room X | room Y | — | B 不收到 A |
| peer leave/rejoin | 離開再加入 | 持續在線 | — | B 正確清理並接受新的 A |
| Extension regression | Extension | Embed | — | 兩者可依同 room identity 建立 P2P，不改壞 Extension |

每次即時驗收都要記錄：

- A、B、C 的 room ID。
- A、B、C 的 peer ID。
- signaling join／disconnect。
- WebRTC call open／close／error。
- message ID、接收者與接收時間。
- danmaku event 是否觸發。

## 必須保留的已知限制

### WebRTC 不是永久訊息資料庫

訊息是 peer-to-peer 傳輸。若房間沒有任何在線 peer，新的 Embed 無法從伺服器取得過去訊息。IndexedDB 只能保存該瀏覽器自己的歷史，不代表全房間歷史。

### Mesh 連線數會隨人數增加

多人 Embed 會建立 peer mesh。N 個 peer 最多需要 O(N²) 條連線；產品應先設定實際支援的人數上限，或在未來人數增加時再評估 Durable Object、AWS API Gateway WebSocket 或其他集中式 relay。

### NAT 可能需要 TURN

Artico 目前的 signaling 與 ICE 設定要以 `@rtco/client` 實際支援為準。若只使用 STUN，部分嚴格 NAT／企業網路可能無法建立 DataChannel；必須在 E2E 測試記錄這類失敗，不得宣稱所有網路環境都保證成功。

## 最終完成條件

- [ ] Embed 不再使用 Vercel WebSocket relay。
- [ ] Embed 使用 Artico signaling＋WebRTC DataChannel。
- [ ] Extension 既有行為與 build 不變。
- [ ] A→B 即時訊息不需要 reload。
- [ ] B 會收到即時 danmaku。
- [ ] 三個獨立 browser context 廣播測試通過。
- [ ] 無痕視窗在有在線 peer 時能補到歷史。
- [ ] 同房間與不同房間測試通過。
- [ ] 無 `REDIS_URL` 也能正常建立 P2P 聊天。
- [ ] `pnpm test`、`pnpm check`、Embed build、Chrome package 全部通過。
- [ ] 文件與 Changelog 已更新，沒有再把 P2P 聊天描述成 Vercel WebSocket relay。

## 給施工 LLM 的重要提醒

1. 不要再加 polling、reload、setInterval 來假裝即時。
2. 不要把瀏覽器本機歷史當成另一個 peer 已經收到訊息的證據。
3. 不要同時保留兩條公開廣播路徑，否則會造成重複訊息與重複彈幕。
4. 先驗證 room ID，再驗證 signaling join，再驗證 WebRTC open，最後才驗證 UI 彈幕。
5. 任何修改 `Peer`、`DeterministicRoom`、`BaseRoom` 的工作，都必須執行 Extension regression test。
6. 只有在兩個獨立瀏覽器 context 的 B 不 reload 收到 A 訊息後，才可以宣稱此問題解決。
