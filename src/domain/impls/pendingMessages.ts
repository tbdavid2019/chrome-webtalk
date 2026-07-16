export class PendingRoomMessages {
  private readonly messages = new Map<string, string[]>()

  enqueue(peerId: string, message: string): void {
    const messages = this.messages.get(peerId) ?? []
    messages.push(message)
    this.messages.set(peerId, messages)
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
  }
}
