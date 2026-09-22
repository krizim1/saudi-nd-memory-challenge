import type { LeaderboardEntry } from '../game/types'
import {
  createEntryId,
  rank,
  type LeaderboardRepository,
  type NewLeaderboardEntry,
} from './leaderboardRepository'

const DB_NAME = 'saudi-memory-challenge'
const DB_VERSION = 1
const STORE = 'leaderboard'

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

/**
 * Standings kept in IndexedDB, so they survive a reload or a machine
 * restart mid-event.
 *
 * The store is trimmed to `storageLimit` on every write rather than
 * swept periodically: a kiosk may be power-cycled at any moment, and a
 * cleanup that only runs on shutdown is a cleanup that never runs.
 */
export class IndexedDbLeaderboardRepository implements LeaderboardRepository {
  private db: Promise<IDBDatabase> | null = null

  private readonly storageLimit: number
  private readonly dbName: string

  constructor(storageLimit: number, dbName: string = DB_NAME) {
    this.storageLimit = storageLimit
    this.dbName = dbName
  }

  private open(): Promise<IDBDatabase> {
    this.db ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
      request.onblocked = () => reject(new Error('IndexedDB open blocked'))
    })

    return this.db
  }

  private async transaction<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => Promise<T>,
  ): Promise<T> {
    const db = await this.open()
    const tx = db.transaction(STORE, mode)
    const result = await run(tx.objectStore(STORE))

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
    })

    return result
  }

  async list(limit?: number): Promise<LeaderboardEntry[]> {
    const all = await this.transaction('readonly', (store) =>
      promisify(store.getAll() as IDBRequest<LeaderboardEntry[]>),
    )

    const ranked = rank(all)
    return limit === undefined ? ranked : ranked.slice(0, limit)
  }

  async add(entry: NewLeaderboardEntry): Promise<LeaderboardEntry> {
    const [saved] = await this.addMany([entry])
    return saved!
  }

  async addMany(entries: NewLeaderboardEntry[]): Promise<LeaderboardEntry[]> {
    const saved = entries.map((entry) => ({ ...entry, id: createEntryId() }))

    await this.transaction('readwrite', async (store) => {
      for (const entry of saved) {
        store.put(entry)
      }

      const all = await promisify(store.getAll() as IDBRequest<LeaderboardEntry[]>)
      for (const dropped of rank(all).slice(this.storageLimit)) {
        store.delete(dropped.id)
      }
    })

    return saved
  }

  async clear(): Promise<void> {
    await this.transaction('readwrite', async (store) => {
      store.clear()
    })
  }
}
