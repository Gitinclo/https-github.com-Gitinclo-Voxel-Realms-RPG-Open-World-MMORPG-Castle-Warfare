/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Local commander persistence adapter for Voxel Realms RPG.
 * Stores commander saves and support tickets cleanly in browser localStorage
 * without requiring an external Firebase project.
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface LocalAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL?: string | null;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {},
  };
  throw new Error(JSON.stringify(errInfo));
}

export interface CommanderSyncPayload {
  commanderName: string;
  allianceTag: string;
  castleLevel: number;
  cultivationRealmIndex: number;
  vipRank: number;
  karmaValue: number;
  garrisonTroopsWire: string;
  discoveredCodexIds: string[];
}

export interface FirestoreCommanderSaveData {
  ownerId: string;
  saveId: string;
  castleLevel: number;
  cultivationRealmIndex: number;
  allianceTag: string;
  garrisonTroopsWire: string;
  discoveredCodexIds: string[];
  version: number;
}

const SAVE_STORAGE_PREFIX = 'voxel_realms_commander_save_v1_';
const TICKET_STORAGE_KEY = 'voxel_realms_support_tickets_v1';

export async function syncUserAccountDocuments(
  user: LocalAuthUser,
  payload: CommanderSyncPayload
): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = `${SAVE_STORAGE_PREFIX}${user.uid}`;
  let prevVersion = 0;
  try {
    const existingRaw = window.localStorage.getItem(key);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as Partial<FirestoreCommanderSaveData>;
      if (typeof existing.version === 'number') prevVersion = existing.version;
    }
  } catch {
    prevVersion = 0;
  }

  const nextSave: FirestoreCommanderSaveData = {
    ownerId: user.uid,
    saveId: 'primary',
    castleLevel: Math.max(0, Math.min(100, Math.trunc(payload.castleLevel))),
    cultivationRealmIndex: Math.max(0, Math.min(22, Math.trunc(payload.cultivationRealmIndex))),
    allianceTag: (payload.allianceTag || 'VXR').slice(0, 8),
    garrisonTroopsWire: payload.garrisonTroopsWire || '0',
    discoveredCodexIds: (payload.discoveredCodexIds || []).slice(0, 64),
    version: prevVersion + 1,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(nextSave));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function subscribeToCommanderSave(
  uid: string,
  onSave: (data: FirestoreCommanderSaveData | null) => void,
  _onError?: (err: Error) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const key = `${SAVE_STORAGE_PREFIX}${uid}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as FirestoreCommanderSaveData;
      onSave(parsed);
    } else {
      onSave(null);
    }
  } catch {
    onSave(null);
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key !== key) return;
    try {
      onSave(e.newValue ? (JSON.parse(e.newValue) as FirestoreCommanderSaveData) : null);
    } catch {
      // Ignore malformed storage events
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export async function createSupportTicketDocument(
  user: LocalAuthUser,
  input: {
    category: string;
    subject: string;
    message: string;
  }
): Promise<string> {
  const cleanSubject = input.subject.trim().slice(0, 120);
  const cleanMessage = input.message.trim().slice(0, 2000);
  if (cleanSubject.length < 3 || cleanMessage.length < 5) {
    throw new Error('Ticket subject (>=3 chars) and details (>=5 chars) are required.');
  }
  const ticketId = `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = window.localStorage.getItem(TICKET_STORAGE_KEY);
      const list = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : [];
      list.unshift({
        ticketId,
        uid: user.uid,
        email: user.email,
        category: input.category,
        subject: cleanSubject,
        message: cleanMessage,
        createdAt: new Date().toISOString(),
      });
      window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch {
      // Ignore storage quota errors
    }
  }
  return ticketId;
}
