/**
 * Keep persisted state partitioned by the same room identity used by WebRTC.
 * A shared key makes old messages from another page appear before any peer
 * synchronization has happened.
 */
export const createRoomStorageKey = (baseKey: string, roomId: string): string => {
  return `${baseKey}:${roomId}`
}
