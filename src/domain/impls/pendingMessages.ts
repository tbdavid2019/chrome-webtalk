export class PendingRoomMessages {
  private readonly messages = new Map<string, string[]>()
  private readonly broadcastMessages: string[] = []

  enqueue(peerId: string, message: string): void {
    const messages = this.messages.get(peerId) ?? []
    messages.push(message)
    this.messages.set(peerId, messages)
  }

  enqueueBroadcast(message: string): void {
    this.broadcastMessages.push(message)
  }

  drainBroadcast(): string[] {
    return this.broadcastMessages.splice(0)
  }

  drain(peerId: string): string[] {
    const messages = this.messages.get(peerId) ?? []
    this.messages.delete(peerId)
    return messages
  }

  remove(peerId: string): void {
    this.messages.delete(peerId)
  }

  clear(): void {
    this.messages.clear()
    this.broadcastMessages.splice(0)
  }
}
