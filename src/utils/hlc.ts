export interface HLC {
  timestamp: number
  counter: number
}

export const createHLC = (): HLC => ({ timestamp: 0, counter: 0 })

export const compareHLC = (a: HLC, b: HLC): number => {
  if (a.timestamp !== b.timestamp) {
    return a.timestamp - b.timestamp
  }

  return a.counter - b.counter
}

export const sendHLCEvent = (localHLC: HLC): HLC => {
  const now = Date.now()

  if (now > localHLC.timestamp) {
    return { timestamp: now, counter: 0 }
  }

  return { timestamp: localHLC.timestamp, counter: localHLC.counter + 1 }
}

export const receiveHLCEvent = (localHLC: HLC, remoteHLC: HLC): HLC => {
  const now = Date.now()
  const maxTimestamp = Math.max(now, localHLC.timestamp, remoteHLC.timestamp)

  if (maxTimestamp === now && now > localHLC.timestamp && now > remoteHLC.timestamp) {
    return { timestamp: now, counter: 0 }
  }

  let maxCounter = 0
  if (maxTimestamp === localHLC.timestamp) {
    maxCounter = Math.max(maxCounter, localHLC.counter)
  }
  if (maxTimestamp === remoteHLC.timestamp) {
    maxCounter = Math.max(maxCounter, remoteHLC.counter)
  }

  return { timestamp: maxTimestamp, counter: maxCounter + 1 }
}

export const maxHLC = (hlcs: HLC[]): HLC => hlcs.reduce((max, current) => (compareHLC(current, max) > 0 ? current : max), createHLC())
