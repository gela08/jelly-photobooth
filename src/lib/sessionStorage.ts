import {
  CountdownSeconds,
  FilterType,
  LayoutType,
  LivePhotoItem,
  PhotoTransform,
  PlacedSticker,
  PoseCount,
  SessionVideoData,
  StripBorderStyle,
  StripDecoration,
  StripThemeId,
} from './types'

const DB_NAME = 'jellybooth_storage'
const DB_VERSION = 1
const DRAFT_STORE = 'draft'
const SAVED_STORE = 'saved_sessions'
const ACTIVE_DRAFT_KEY = 'active'

export interface StoredLivePhotoRecord {
  id: string
  stillUrl: string
  videoBlob?: Blob
  videoMimeType?: string
  videoExt?: 'mp4' | 'webm'
  durationSec: number
  keyPhotoOffsetSec: number
  hasAudio: boolean
  burstFrames?: string[]
  warning?: string
}

export interface PersistedSessionRecord {
  id: string
  savedAt: number
  step: 'customize' | 'export'
  poseCount: PoseCount
  countdown: CountdownSeconds
  filter: FilterType
  layout: LayoutType
  caption: string
  showDate: boolean
  photos: string[]
  photoTransforms: PhotoTransform[]
  stickers: PlacedSticker[]
  stripTheme: StripThemeId
  customStripColor: string
  borderStyle: StripBorderStyle
  stripDecoration: StripDecoration
  liveCaptureEnabled: boolean
  livePhotoEnabled: boolean
  includeAudio: boolean
  liveFramesPerPose?: string[][]
  livePhotos?: StoredLivePhotoRecord[]
  sessionVideoBlob?: Blob
  sessionVideoMeta?: {
    videoMimeType?: string
    videoExt?: 'mp4' | 'webm'
    durationSec?: number
    warning?: string
  }
}

export interface HydratedSessionRecord extends Omit<PersistedSessionRecord, 'livePhotos' | 'sessionVideoBlob' | 'sessionVideoMeta'> {
  sessionVideo?: SessionVideoData
}

function openBoothDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'))
      return
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SAVED_STORE)) {
        db.createObjectStore(SAVED_STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Failed to open local session storage.'))
  })
}

async function fetchBlobSafe(url?: string): Promise<Blob | undefined> {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    return await res.blob()
  } catch {
    return undefined
  }
}

export async function serializeSessionForStorage(params: {
  id: string
  step: 'customize' | 'export'
  poseCount: PoseCount
  countdown: CountdownSeconds
  filter: FilterType
  layout: LayoutType
  caption: string
  showDate: boolean
  photos: string[]
  photoTransforms: PhotoTransform[]
  stickers: PlacedSticker[]
  stripTheme: StripThemeId
  customStripColor: string
  borderStyle: StripBorderStyle
  stripDecoration: StripDecoration
  liveCaptureEnabled: boolean
  livePhotoEnabled: boolean
  includeAudio: boolean
  sessionVideo?: SessionVideoData
}): Promise<PersistedSessionRecord> {
  const { sessionVideo } = params

  let livePhotos: StoredLivePhotoRecord[] | undefined
  if (sessionVideo?.livePhotos && sessionVideo.livePhotos.length > 0) {
    livePhotos = await Promise.all(
      sessionVideo.livePhotos.map(async (lp) => {
        const blob = lp.videoBlob ?? (await fetchBlobSafe(lp.videoUrl))
        return {
          id: lp.id,
          stillUrl: lp.stillUrl,
          videoBlob: blob,
          videoMimeType: lp.videoMimeType,
          videoExt: lp.videoExt,
          durationSec: lp.durationSec,
          keyPhotoOffsetSec: lp.keyPhotoOffsetSec,
          hasAudio: lp.hasAudio,
          burstFrames: lp.burstFrames,
          warning: lp.warning,
        }
      })
    )
  }

  let sessionVideoBlob: Blob | undefined
  if (sessionVideo?.videoUrl) {
    sessionVideoBlob = await fetchBlobSafe(sessionVideo.videoUrl)
  }

  return {
    id: params.id,
    savedAt: Date.now(),
    step: params.step,
    poseCount: params.poseCount,
    countdown: params.countdown,
    filter: params.filter,
    layout: params.layout,
    caption: params.caption,
    showDate: params.showDate,
    photos: params.photos,
    photoTransforms: params.photoTransforms,
    stickers: params.stickers,
    stripTheme: params.stripTheme,
    customStripColor: params.customStripColor,
    borderStyle: params.borderStyle,
    stripDecoration: params.stripDecoration,
    liveCaptureEnabled: params.liveCaptureEnabled,
    livePhotoEnabled: params.livePhotoEnabled,
    includeAudio: params.includeAudio,
    liveFramesPerPose: sessionVideo?.liveFramesPerPose,
    livePhotos,
    sessionVideoBlob,
    sessionVideoMeta: sessionVideo
      ? {
          videoMimeType: sessionVideo.videoMimeType,
          videoExt: sessionVideo.videoExt,
          durationSec: sessionVideo.durationSec,
          warning: sessionVideo.warning,
        }
      : undefined,
  }
}

export function hydrateStoredSession(record: PersistedSessionRecord): HydratedSessionRecord {
  const livePhotos: LivePhotoItem[] | undefined = record.livePhotos?.map((lp) => ({
    id: lp.id,
    stillUrl: lp.stillUrl,
    videoBlob: lp.videoBlob,
    videoUrl: lp.videoBlob ? URL.createObjectURL(lp.videoBlob) : undefined,
    videoMimeType: lp.videoMimeType,
    videoExt: lp.videoExt,
    durationSec: lp.durationSec,
    keyPhotoOffsetSec: lp.keyPhotoOffsetSec,
    hasAudio: lp.hasAudio,
    burstFrames: lp.burstFrames,
    warning: lp.warning,
  }))

  const videoUrl = record.sessionVideoBlob
    ? URL.createObjectURL(record.sessionVideoBlob)
    : undefined

  const hasAnyLiveData = Boolean(
    (record.liveFramesPerPose && record.liveFramesPerPose.length > 0) ||
      (livePhotos && livePhotos.length > 0) ||
      videoUrl ||
      record.sessionVideoMeta?.warning
  )

  const sessionVideo: SessionVideoData | undefined = hasAnyLiveData
    ? {
        liveFramesPerPose: record.liveFramesPerPose ?? [],
        livePhotos,
        videoUrl,
        videoMimeType: record.sessionVideoMeta?.videoMimeType,
        videoExt: record.sessionVideoMeta?.videoExt,
        durationSec: record.sessionVideoMeta?.durationSec,
        warning: record.sessionVideoMeta?.warning,
      }
    : undefined

  return {
    id: record.id,
    savedAt: record.savedAt,
    step: record.step,
    poseCount: record.poseCount,
    countdown: record.countdown,
    filter: record.filter,
    layout: record.layout,
    caption: record.caption,
    showDate: record.showDate,
    photos: record.photos,
    photoTransforms: record.photoTransforms,
    stickers: record.stickers,
    stripTheme: record.stripTheme,
    customStripColor: record.customStripColor,
    borderStyle: record.borderStyle,
    stripDecoration: record.stripDecoration,
    liveCaptureEnabled: record.liveCaptureEnabled,
    livePhotoEnabled: record.livePhotoEnabled,
    includeAudio: record.includeAudio,
    sessionVideo,
  }
}

export async function saveActiveDraft(record: PersistedSessionRecord): Promise<void> {
  const db = await openBoothDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAFT_STORE, 'readwrite')
      tx.objectStore(DRAFT_STORE).put({ ...record, id: ACTIVE_DRAFT_KEY })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Failed to save session draft.'))
    })
  } finally {
    db.close()
  }
}

export async function loadActiveDraft(): Promise<PersistedSessionRecord | null> {
  const db = await openBoothDb()
  try {
    return await new Promise<PersistedSessionRecord | null>((resolve, reject) => {
      const tx = db.transaction(DRAFT_STORE, 'readonly')
      const req = tx.objectStore(DRAFT_STORE).get(ACTIVE_DRAFT_KEY)
      req.onsuccess = () => resolve((req.result as PersistedSessionRecord | undefined) ?? null)
      req.onerror = () => reject(req.error || new Error('Failed to read session draft.'))
    })
  } finally {
    db.close()
  }
}

export async function clearActiveDraft(): Promise<void> {
  const db = await openBoothDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DRAFT_STORE, 'readwrite')
      tx.objectStore(DRAFT_STORE).delete(ACTIVE_DRAFT_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Failed to clear session draft.'))
    })
  } finally {
    db.close()
  }
}

/**
 * Saves a new immutable snapshot into saved_sessions without overwriting prior saves.
 */
export async function saveSessionSnapshot(record: PersistedSessionRecord): Promise<string> {
  const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const db = await openBoothDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SAVED_STORE, 'readwrite')
      tx.objectStore(SAVED_STORE).add({ ...record, id: snapshotId, savedAt: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Failed to store saved session.'))
    })
    return snapshotId
  } finally {
    db.close()
  }
}

export async function listSavedSessions(): Promise<PersistedSessionRecord[]> {
  const db = await openBoothDb()
  try {
    return await new Promise<PersistedSessionRecord[]>((resolve, reject) => {
      const tx = db.transaction(SAVED_STORE, 'readonly')
      const req = tx.objectStore(SAVED_STORE).getAll()
      req.onsuccess = () => {
        const items = (req.result as PersistedSessionRecord[] | undefined) ?? []
        items.sort((a, b) => b.savedAt - a.savedAt)
        resolve(items)
      }
      req.onerror = () => reject(req.error || new Error('Failed to list saved sessions.'))
    })
  } finally {
    db.close()
  }
}

export async function deleteSavedSession(id: string): Promise<void> {
  const db = await openBoothDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SAVED_STORE, 'readwrite')
      tx.objectStore(SAVED_STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error || new Error('Failed to delete saved session.'))
    })
  } finally {
    db.close()
  }
}
