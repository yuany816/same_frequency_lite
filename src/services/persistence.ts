import { callFunction } from './cloud'
import type { PersistedAppState } from '../store/useAppStore'

export async function loadRemoteState(relationshipId?: string): Promise<Partial<PersistedAppState> | null> {
  return callFunction<Partial<PersistedAppState> | null>('getCoupleState', { relationshipId })
}

export async function saveRemoteState(snapshot: PersistedAppState): Promise<void> {
  await callFunction('syncCoupleState', { relationshipId: snapshot.relationshipId, snapshot })
}
