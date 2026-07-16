export interface LeaveableRoom {
  leave: () => void
}

/**
 * A React cleanup can run before the asynchronous room join completes.
 * In that case there is no room to leave yet: deferring this cleanup would
 * incorrectly close a room created by a later render.
 */
export const leaveAttachedRoom = (room?: LeaveableRoom): boolean => {
  if (!room) return false

  room.leave()
  return true
}
