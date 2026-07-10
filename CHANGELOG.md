# CHANGELOG

## [1.6.0] - 2026-07-10

### Added

- **Protocol text extension 疊層**：在 upstream `text` 訊息上新增 fork 專用的 optional `extension` metadata，承載 `AI / private` 類型資訊，不再把這些功能綁死在 legacy `Text` payload。

### Changed

- **Upstream 模式全面改走 protocol text**：`compatibilityMode = upstream` 下，公開訊息、`@ai` 房間回覆與私聊文字現在都會優先走 upstream text 結構；只有 fork 專屬語意才附加 `extension`。
- **私聊改為 upstream 定向傳送**：upstream 模式的私聊文字訊息不再退回 legacy text，而是改用 protocol text 只發給目標 peer，讓公開協定與 fork 擴充層的邊界更清楚。
- **AI/private metadata 可隨 history-sync 保留**：fork peer 在接收 upstream text 或 history-sync 時，會還原 AI badge、owner metadata 與 private 標記；原版 upstream peer 則仍可把它視為一般文字訊息處理。

### Fixed

- **options/chat 殘留硬編碼文案清理**：修正設定頁 `Developer Mode`、`Hide All AI Messages` 與聊天私聊 badge 的殘留硬編碼，回到 `uiText` 多語系來源。

---

## [1.5.9] - 2026-07-10

### Added

- **Upstream reaction/HLC 第二階段**：`compatibilityMode = upstream` 下，公開聊天室的 `👍 / 👎` 互動已可改走 upstream `reaction` 訊息，並為文字、reaction、peer-sync、history-sync 補上 Hybrid Logical Clock（HLC）欄位。

### Changed

- **公開聊天室排序改為 HLC 優先**：訊息列表在有 upstream HLC 時會先依 HLC 排序，再以 `sendTime` 作為 fallback，降低多 peer 同步時的順序漂移。
- **Upstream 歷史同步升級**：接收 upstream `history-sync` 時會保留 `hlc` 與 reaction 狀態到本地訊息模型，為後續更完整對齊原版 WebChat 協定打好基礎。

---

## [1.5.8] - 2026-07-10

### Added

- **Upstream 相容模式初版**：設定頁新增 `Chat Protocol` 切換，可在 `legacy` 與 `upstream` 間切換，方便測試與原版 `molvqingtai/WebChat` 的公開聊天室互通。

### Changed

- **Dual parser 收訊管線**：聊天室收訊現在會同時辨識既有 legacy 協定與 upstream `text / peer-sync / history-sync` 協定，為公開房間互通打開第一步。
- **Upstream 公開文字同步**：在 `compatibilityMode = upstream` 下，公開文字訊息、`peer-sync` 與基本 `history-sync` 會改走 upstream 風格封包；私聊、AI metadata 與 reaction 仍暫留後續版本處理。

---

## [1.5.7] - 2026-07-10

### Added

- **協定層抽離地基**：新增 `src/protocol/Message.ts`、`src/protocol/LegacyChatRoom.ts` 與 adapter，將聊天室 wire format 從 `ChatRoomDomain` 內聯定義中抽離，為後續逐步靠攏 upstream `WebChat` 協定做準備。
- **相容模式設定欄位骨架**：`UserInfo` 新增 `compatibilityMode`，預設為 `legacy`，先完成資料模型與儲存層鋪墊。

### Changed

- **ChatRoom 改用外部 protocol 定義**：目前聊天室仍維持既有 legacy 協定對外行為，但 schema 驗證與型別定義已改由 `src/protocol/*` 提供，降低後續切換 upstream 相容模式的改動面。

---

## [1.5.6] - 2026-07-10

### Added

- **介面語系選擇器**：設定頁新增 `Interface Language`，可明確指定 `Auto / 繁體中文 / 简体中文 / English`，不再只能被動跟隨瀏覽器語系。

### Fixed

- **`@ai` 回覆語言鎖定**：房間 AI 現在會跟隨你的語系設定回覆；選擇繁中時會明確要求模型只用繁體中文，避免回成簡體中文。
- **新功能文案多語系化**：這次新增的 `@ai` 提示、Copy/Ban 操作、長度/離線警告與私聊 placeholder 已改走語系表，不再把文字硬寫在元件內。

---

## [1.5.5] - 2026-07-10

### Added

- **`@ai` 房間機器人回覆**：在公開聊天室輸入 `@ai ...` 後，訊息會先正常送進房間，再由發送者本機呼叫 AI，最後將 AI 回覆作為獨立訊息廣播回聊天室，提升房間互動性。
- **AI 訊息獨立樣式與標記**：AI 回覆現在帶有專屬框線、`AI` badge 與 `by @觸發者` 標示，能和一般使用者訊息清楚區分。
- **本地 AI 可見性控制**：設定頁新增 `Hide All AI Messages` 開關，可在本地隱藏全部 AI 訊息，不影響其他使用者。
- **本地封鎖連帶 AI 過濾**：封鎖某位使用者後，除了隱藏他的真人訊息，也會一併隱藏由他觸發的 AI 回覆。

### Fixed

- **AI 訊息不進彈幕**：AI 回覆不再推送到網頁漂浮彈幕，避免畫面被機器人內容洗版。
- **Options 頁底部遮擋修復**：將底部 `GitHub / 開源專案` 連結改回正常版面流，修復浮動 badge 壓住設定欄位的問題。
- **聊天室字體系統統一**：將內容面板、header、按鈕與 toast 收斂到同一套中英混排 sans 字體堆疊，改善先前字體混亂與觀感不一致問題。

---

## [1.5.4] - 2026-07-10

### Added

- **單篇訊息操作列**：每則聊天訊息底下新增接近 Gemini / ChatGPT 風格的操作列，提供 `👍`、`👎` 與單篇 `Copy` 複製內文按鈕；複製成功後會即時顯示狀態與 toast 提示。
- **Developer Mode 開發者模式**：在設定頁新增開發者模式開關，跨網站 presence 與站點切換/debug 入口預設對一般使用者隱藏，僅在開發者模式下顯示。

### Fixed

- **訊息長度限制警示補強**：保留既有 500 字元輸入上限，但在接近上限時會以顏色高亮提示，達上限時主動跳出 warning，不再出現靜默卡住或像被截斷卻無提示的體驗。
- **Header 在線狀態視覺精簡**：將冗長的 `ONLINE` 文案收斂為更一致的 `👥 數字` 人數徽章，改善字體不統一與資訊噪音問題。

---

## [1.5.3] - 2026-07-09

### Fixed

- **私聊 Like/Hate 路由修正**：修復私聊消息的點讚/踩永遠發給 toUser（可能是自己）的問題，現在根據 self 判斷另一方並定向發送。
- **私聊發送使用即時 peerIds**：修復發送私訊時使用過期快照 peerIds 的問題，改為每次發送時從 UserListQuery 取得最新 peerIds，支援多分頁/多裝置場景。

---

## [1.5.2] - 2026-07-09

### Fixed

- **LastMessageTimeQuery 排除私聊消息**：修復最後訊息時間查詢仍將私聊計入的問題，避免洩漏私聊 metadata 並修正歷史同步誤判。
- **私聊 Like/Hate 定向發送**：修復私聊消息的點讚/踩仍全房間廣播的問題，現在僅發送給私聊參與雙方。
- **多分頁/多裝置私聊目標保留**：修復同一用戶多個 peerId 時，任一 peer 離線即取消私聊目標的問題，現在僅在該用戶所有 peer 離線時才取消。
- **歷史同步天數計算修正**：修復 `message.sendTime - Date.now()` 方向相反導致3天限制失效的問題。
- **README 連結修正**：將本機 `file:///` 連結改為相對路徑。

---

## [1.5.1] - 2026-07-09

### Fixed

- **私聊消息隱私洩漏修復**：修復私聊消息對所有房間用戶可見的嚴重隱私問題。現在私聊消息僅發送者與接收者可見，其他用戶不會看到任何私聊內容。
- **歷史同步排除私聊消息**：新用戶加入房間時，歷史同步不再包含私聊消息，避免隱私洩漏。
- **私聊消息互動權限控制**：非私聊參與者無法對私聊消息進行點讚/踩操作。

---

## [1.4.0] - 2026-07-04

### Added

- **預埋實驗額度 Key 與防呆引導**：預置了實驗性 Groq API 金鑰 `gsk_ZXLmQTdpmUAIHGMnIfmQWGdyb3FYR4YeJg3gf7` 供直接使用。當請求失敗（如额度用盡、失效）時，系統會彈出中文/英文的醒目警示，主動引導使用者前往 Groq Console 申請自己的 API Key 並在設定中進行替換。

### Fixed

- **聊天室關閉按鈕壓線/溢出修復**：解決聊天室 Header 右上角關閉 `✕` 按鈕在部分螢幕解析度下靠右壓線、甚至被推出畫面的問題。改用彈性 `flex` 佈局自適應排版，使其恆定與右邊框保持舒適的內縮安全邊距。
- **預設 API 與模型修正**：更改預設 API Provider 為 Groq，預設模型為 `openai/gpt-oss-120b`；將所有設定面板中的 "Gemini" 字樣更換為 "Groq"，並新增申請 API Key 的 Groq 控制台外部連結。

---

## [1.3.9] - 2026-07-03

### Fixed

- **漂浮對話氣泡超長句子截斷修正**：將彈幕/漂浮消息氣泡的最大寬度從偏小的 `max-w-44` (176px) 擴大至 **`max-w-[480px]` (近 3 倍寬度)**，完美解決長篇英文、中文長句在網頁漂浮視窗中顯示不全、被過早砍斷的問題。

---

## [1.3.8] - 2026-07-03

### Added

- **雙向導航 Tab 膠囊**：於聊天室 Footer 左下角與 AI 空間最左下角新增 `[ 💬 聊天 | ✨ AI ]` 雙鍵切換膠囊，實現像素級對齊的 Tab 式無縫切換體驗。
- **無訊息虛線框引導**：當聊天室為空時，自動渲染 Morandi 風格的虛線提示框，引導使用者輸入並發言，拒絕光禿禿的一片。

### Fixed

- **對話點讚 (Like/Hate) 按鈕配色修正**：解決在 Light 模式下，Like 按鈕背景誤套用 secondary 深色變數而導致的「黑斑塊」問題。未選中改為溫潤的 `bg-muted` 燕麥咖，選中改為 `bg-primary/20` 淡栗子紅，高對比且精緻。
- **統一 Header 關閉按鈕 X 樣式**：將聊天室 Header 右上角的 `X` 關閉按鈕，改為與 AI 空間完全一致的 `size-7` 圓圈外框與 `XIcon` 設計。
- **統一 Header 關閉按鈕 X 位置**：將聊天室頂部的 X 關閉按鈕從 ONLINE 左側移至最右上角（最後一個按鈕），符合大眾使用習慣。
- **消滅狗皮藥膏不對齊設計**：重新調整 AI 空間頂部 Header 控制欄的元素高度（統一為 `h-7` / `size-7`）與垂直置中，移除擁擠的「聊天室」返回按鈕，使版面極致齊平。
- **聊天輸入框對齊**：移除 Chat 輸入框外層繁瑣的 `ScrollArea`，改為與 AI 空間一致的 `rounded-xl border-border bg-muted` 設計，並加入 Focus 紅暈。

---

## [1.3.1] ~ [1.3.4] - 2026-07-03

### Added

- **AI 空間「單一對話流 (Unified Message Flow)」重構**：將「網頁摘要」整合為對話流的最頂端置頂消息，支持追問與連續對話。
- **動作按鈕精簡化與合併**：移除原本臃腫的「重新摘要 / 複製 / markdown」三大按鈕，改為精巧的 `[ 🔄 重新濃縮 | 📋 複製 | 📄 MD | 🗑️ 清除 ]` 合併於氣泡右上角，釋放 50px 垂直空間。
- **字型物理載入與 CSP 解鎖**：將 JetBrainsMono 與 MapleMono 字型放入 `src/public/fonts/` 並在 Shadow Root 動態載入 Chrome Extension 絕對 URL，徹底解決 404 與安全策略攔截問題。
- **字體有感放大**：為照顧視力，將摘要、聊天氣泡、輸入框文字大小全面放大至 `text-base` (16px)，輔助文字放大至 `text-sm` (14px)。
- **暖調燕麥拿鐵配色 (Warm Latte & Papyrus)**：引入「333TTSWeb」書卷色系，使用米黃背景、深咖文字、栗紅主色與藍綠輔助色。

### Fixed

- **兔子點擊不靈敏問題**：在拖曳手勢中引入 `4px` 拖曳死區防抖閾值，解決滑鼠微小抖動導致 click 事件被攔截吞掉的 Bug，按鈕點擊秒響應！
- **WXT 輸出路徑配置**：將 WXT 配置輸出目錄指定為 `output/` 而非隱藏的 `.output/`，解決 Mac 選取不到隱藏檔案的痛點。
