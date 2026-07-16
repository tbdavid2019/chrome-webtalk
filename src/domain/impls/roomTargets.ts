export const resolveRoomSendTargets = (
  target: string | string[] | undefined,
  connectedPeerIds: readonly string[]
): string[] => (target ? (Array.isArray(target) ? target : [target]) : [...connectedPeerIds])
