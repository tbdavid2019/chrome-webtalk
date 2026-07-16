import { nanoid } from 'nanoid'
import { Artico, SocketSignaling } from '@rtco/client'

import { DeterministicRoom } from './DeterministicRoom'

export interface Config {
  peerId?: string
}

export default class Peer extends Artico {
  private static instance: Peer | null = null
  private readonly roomSignaling: SocketSignaling

  private constructor(config: Config = {}) {
    const { peerId = nanoid() } = config
    const signaling = new SocketSignaling({ id: peerId })
    super({ id: peerId, signaling })
    this.roomSignaling = signaling
  }

  public joinDeterministicRoom(roomId: string): DeterministicRoom {
    return new DeterministicRoom({ peer: this, signaling: this.roomSignaling, roomId })
  }

  public static createInstance(config: Config = {}) {
    return (this.instance ??= new Peer(config))
  }

  public static getInstance() {
    return this.instance
  }
}
