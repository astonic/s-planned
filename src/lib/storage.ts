import fs from 'fs/promises'
import path from 'path'

// ── Interface ─────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string
  fileSize: number
}

export interface StorageService {
  upload(buffer: Buffer, storagePath: string): Promise<UploadResult>
  delete(storagePath: string): Promise<void>
}

// ── Local Disk Adapter ────────────────────────────────────────────────────────

const STORAGE_ROOT = process.env.STORAGE_PATH ?? path.join(process.cwd(), 'uploads')

export class LocalStorageAdapter implements StorageService {
  async upload(buffer: Buffer, storagePath: string): Promise<UploadResult> {
    const absPath = this.resolve(storagePath)
    await fs.mkdir(path.dirname(absPath), { recursive: true })
    await fs.writeFile(absPath, buffer)
    return {
      url: `/api/files/${storagePath}`,
      fileSize: buffer.byteLength,
    }
  }

  async delete(storagePath: string): Promise<void> {
    const absPath = this.resolve(storagePath)
    await fs.unlink(absPath).catch(() => {/* already gone */})
  }

  /** Resolve and validate the path to prevent directory traversal */
  private resolve(storagePath: string): string {
    const abs = path.resolve(STORAGE_ROOT, storagePath)
    if (!abs.startsWith(path.resolve(STORAGE_ROOT))) {
      throw new Error('Invalid storage path')
    }
    return abs
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const storageService: StorageService = new LocalStorageAdapter()
