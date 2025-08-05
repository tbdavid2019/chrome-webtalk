# 修復：同域下大量訊息導致新用戶無法發送訊息的問題

## 問題描述

在同一個網域下，當已有其他用戶發送了大量訊息時，新加入的用戶無法發送訊息。

## 問題根源分析

### 1. WebRTC 消息大小限制

- WebRTC DataChannel 有 256KiB (262,144 bytes) 的消息大小限制
- 超過此限制的消息會導致連接斷開

### 2. 歷史消息同步機制問題

- 當新用戶加入房間時，會觸發歷史消息同步
- 如果歷史消息過多，會產生大量同步請求
- 這些請求可能阻塞正常的文本消息發送

### 3. 缺乏錯誤處理

- 文本消息發送時沒有大小檢查
- WebRTC 連接錯誤時缺乏適當的錯誤處理
- 用戶不知道消息發送失敗的原因

## 解決方案

### 1. 文本消息大小檢查

在 `ChatRoom.ts` 的 `SendTextMessageCommand` 中添加：

```typescript
// 檢查消息大小是否超過 WebRTC 限制
const messageSize = getTextByteSize(JSON.stringify(textMessage))
if (messageSize >= WEB_RTC_MAX_MESSAGE_SIZE) {
  console.error('Message too large to send:', messageSize, 'bytes')
  return []
}
```

### 2. 優化歷史消息同步策略

- **分批同步**：每批最多同步 50 條消息，而不是限制總數量
- **延遲發送**：批次間延遲 500ms，消息間延遲 50ms
- **智能分包**：根據消息大小動態調整每批的消息數量
- **完整同步**：確保所有符合條件的歷史消息都能被同步

```typescript
export const SYNC_MESSAGES_BATCH_SIZE = 50 as const
export const SYNC_BATCH_DELAY_MS = 500 as const
export const SYNC_MESSAGE_DELAY_MS = 50 as const
```

### 3. 強化錯誤處理

在 `ChatRoom.ts` 和 `VirtualRoom.ts` 的實作中：

- 添加 try-catch 錯誤捕獲
- 檢查消息序列化是否成功
- 發送失敗時發出適當的錯誤事件

### 4. 新增配置常數

```typescript
export const MAX_SYNC_MESSAGES_PER_REQUEST = 10 as const
export const SYNC_MESSAGE_DELAY_MS = 100 as const
```

## 修改的檔案

1. `src/domain/ChatRoom.ts`
   - 添加文本消息大小檢查
   - 限制歷史消息同步數量
   - 添加錯誤處理

2. `src/domain/impls/ChatRoom.ts`
   - 強化 `sendMessage` 的錯誤處理

3. `src/domain/impls/VirtualRoom.ts`
   - 強化 `sendMessage` 的錯誤處理

4. `src/constants/config.ts`
   - 添加歷史消息同步限制配置

## 預期效果

1. **防止消息過大**：超過限制的消息不會發送，避免連接斷開
2. **減少歷史消息阻塞**：限制同步數量和添加延遲，確保正常聊天不受影響
3. **更好的錯誤提示**：用戶可以在控制台看到發送失敗的具體原因
4. **提高系統穩定性**：減少因大量消息同步導致的連接問題

## 建議的後續改進

1. **用戶界面提示**：在 UI 中顯示消息發送失敗的提示
2. **動態調整同步策略**：根據網絡狀況調整歷史消息同步的數量和頻率
3. **消息壓縮**：對大型消息進行壓縮處理
4. **分頁同步**：將歷史消息分頁同步，用戶可按需載入更多歷史
