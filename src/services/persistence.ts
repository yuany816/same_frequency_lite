import { callFunction } from './cloud'
import type { PersistedAppState } from '../store/useAppStore'

export async function loadRemoteState(relationshipId?: string): Promise<Partial<PersistedAppState> | null> {
  if (!relationshipId) return null
  return callFunction<Partial<PersistedAppState> | null>('getCoupleState', { relationshipId })
}

let pendingSnapshot: PersistedAppState | null = null
let saveQueue: Promise<void> = Promise.resolve()

export async function saveRemoteState(snapshot: PersistedAppState): Promise<void> {
  if (!snapshot.relationshipId) return
  pendingSnapshot = snapshot
  saveQueue = saveQueue.then(async () => {
    const nextSnapshot = pendingSnapshot
    pendingSnapshot = null
    if (!nextSnapshot?.relationshipId) return
    await callFunction('syncCoupleState', {
      relationshipId: nextSnapshot.relationshipId,
      snapshot: nextSnapshot
    })
  })
  return saveQueue
}
