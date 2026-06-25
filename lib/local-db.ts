const requireFn = eval('require') as (moduleName: string) => any
const fs = requireFn('fs').promises as any
const path = requireFn('path') as any

const processEnv = (globalThis as any).process?.env || {}
const defaultDataDir = path.join((globalThis as any).process.cwd(), '.data')
const vercelFallbackDataDir = path.join('/tmp', '.data')
const os = requireFn('os') as any
const tmpFallbackDataDir = path.join(os.tmpdir(), '.adis-ot-connect-dashboard', '.data')

// Prefer an explicit override, otherwise start with project-local dir.
// We'll attempt writable fallbacks at runtime if that fails (useful on Vercel).
let DATA_DIR = processEnv.LOCAL_DB_DIR?.trim() || defaultDataDir
let DB_PATH = path.join(DATA_DIR, 'local-db.json')

const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_EMAIL = 'admin@adis.ae'
const DEFAULT_ADMIN_PASSWORD_HASH = '$2b$10$yPr0nv1mgNh.NNa77/YHl.LSpp8ruyJWBKapzWEAN0NPQBQG0uC.G'

export interface LocalAdmin {
  id: number
  username: string
  email: string
  passwordHash: string
  name: string
  createdAt: string
}

export interface LocalNfcTag {
  id: number
  nfcCode: string
  studentId: string
  studentName: string
  class: string
  block: string
  parentEmail: string | null
  grNumber: string | null
  createdAt: string
}

export interface LocalDismissal {
  id: number
  studentId: string
  studentName: string
  class: string
  block: string
  parentName: string
  parentPhone: string
  pickupMethod: string
  nfcScanTime: string | null
  gateScanTime: string | null
  groundOpsTime: string | null
  finalDismissalTime: string | null
  status: string
  notes: string | null
  userId: string
  dispersalSessionId: string | null
  dispersalGroupId: string | null
  pickedUpAt: string | null
  nfcCode?: string
  createdAt: string
}

export type DispersalGroupId = 'KG' | 'G1-12' | 'B1-12'

export interface DispersalSession {
  id: string
  groupId: DispersalGroupId
  startedAt: string
  endedAt: string | null
  userId: string
  createdAt: string
}

export interface PickupLog {
  id: string
  studentId: string
  studentName: string
  grNumber: string | null
  class: string
  sessionId: string
  groupId: DispersalGroupId
  parentEmail: string | null
  pickedUpAt: string
  overriddenAt: string | null
  createdAt: string
}

export interface LocalStaffMember {
  id: number
  staffName: string
  username: string | null
  passwordHash: string | null
  role: string
  block: string | null
  phone: string | null
  email: string | null
  nfcLoginFormat: string | null
  isActive: boolean
  userId: string
  lastLogin: string | null
  createdAt: string
}

export interface StudentPhoto {
  id: number
  studentId: string
  photoData: string // base64 encoded image
  uploadedAt: string
}

export interface StudentChild {
  id: number
  parentId: number
  studentId: string
  studentName: string
  class: string
  block: string
  nfcCode: string
  photoId: number | null // reference to StudentPhoto
  isActive: boolean
  createdAt: string
}

export interface LocalParent {
  id: number
  nfcCode: string
  parentName: string
  phone: string | null
  email: string | null
  pickedUpAt: string | null
  createdAt: string
}

export interface LocalDbState {
  admin: LocalAdmin[]
  nfcTags: LocalNfcTag[]
  dismissals: LocalDismissal[]
  staffDirectory: LocalStaffMember[]
  dispersalSessions: DispersalSession[]
  pickupLogs: PickupLog[]
  parents: LocalParent[]
  studentChildren: StudentChild[]
  studentPhotos: StudentPhoto[]
}

const emptyState = (): LocalDbState => ({
  admin: [],
  nfcTags: [],
  dismissals: [],
  staffDirectory: [],
  dispersalSessions: [],
  pickupLogs: [],
  parents: [],
  studentChildren: [],
  studentPhotos: [],
})

let lock = Promise.resolve()

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = lock.then(task, task)
  lock = run.then(() => undefined, () => undefined)
  return run
}

async function ensureDataDir() {
  const tried: string[] = []
  const candidates = [DATA_DIR, tmpFallbackDataDir, vercelFallbackDataDir]
  let lastError: any = null

  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      await fs.mkdir(candidate, { recursive: true })
      DATA_DIR = candidate
      DB_PATH = path.join(DATA_DIR, 'local-db.json')
      return
    } catch (err: any) {
      lastError = err
      tried.push(`${candidate} (${err?.code || err})`)
      // try next candidate
    }
  }

  // If we get here none of the candidates worked — surface a clearer error.
  const message = `Failed to create writable data directory. Tried: ${tried.join(', ')}`
  const error = new Error(message)
  ;(error as any).cause = lastError
  throw error
}

async function createDefaultAdminIfNeeded(state: LocalDbState) {
  if (state.admin.length > 0) {
    return false
  }
  state.admin.push({
    id: 1,
    username: DEFAULT_ADMIN_USERNAME,
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: DEFAULT_ADMIN_PASSWORD_HASH,
    name: 'Admin Staff',
    createdAt: new Date().toISOString(),
  })
  return true
}

async function loadState(): Promise<LocalDbState> {
  await ensureDataDir()

  try {
    const raw = await fs.readFile(DB_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<LocalDbState>
    const state: LocalDbState = {
      ...emptyState(),
      ...parsed,
      admin: parsed.admin || [],
      nfcTags: (parsed.nfcTags || []).map((tag: any) => ({
        ...tag,
        parentEmail: tag.parentEmail ?? null,
        grNumber: tag.grNumber ?? null,
      })),
      dismissals: (parsed.dismissals || []).map((d: any) => ({
        ...d,
        dispersalSessionId: d.dispersalSessionId ?? null,
        dispersalGroupId: d.dispersalGroupId ?? null,
        pickedUpAt: d.pickedUpAt ?? null,
      })),
      staffDirectory: (parsed.staffDirectory || []).map((s: any) => ({
        ...s,
        username: s.username ?? null,
        passwordHash: s.passwordHash ?? null,
        nfcLoginFormat: s.nfcLoginFormat ?? null,
        lastLogin: s.lastLogin ?? null,
      })),
      dispersalSessions: parsed.dispersalSessions || [],
      pickupLogs: parsed.pickupLogs || [],
      parents: parsed.parents || [],
      studentChildren: parsed.studentChildren || [],
      studentPhotos: parsed.studentPhotos || [],
    }

    return state
  } catch {
    const state = emptyState()
    await createDefaultAdminIfNeeded(state)
    await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf8')
    return state
  }
}

async function saveState(state: LocalDbState) {
  await ensureDataDir()
  await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2), 'utf8')
}

function nextId<T extends { id: number }>(items: T[]) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function readLocalDb() {
  return withLock(async () => {
    const state = await loadState()
    const changed = await createDefaultAdminIfNeeded(state)
    if (changed) {
      await saveState(state)
    }
    return state
  })
}

export async function updateLocalDb<T>(mutator: (state: LocalDbState) => Promise<T> | T) {
  return withLock(async () => {
    const state = await loadState()
    await createDefaultAdminIfNeeded(state)
    const result = await mutator(state)
    await saveState(state)
    return result
  })
}

export async function findAdminByLogin(login: string) {
  const state = await readLocalDb()
  const normalized = login.trim().toLowerCase()
  return (
    state.admin.find(
      (admin) =>
        admin.username.toLowerCase() === normalized ||
        admin.email.toLowerCase() === normalized
    ) || null
  )
}

export async function getAdminById(id: number) {
  const state = await readLocalDb()
  return state.admin.find((admin) => admin.id === id) || null
}

export async function ensureDefaultAdminAccount() {
  await updateLocalDb(async () => undefined)
}

// Parent operations
export async function registerParent(
  nfcCode: string,
  parentName: string,
  phone?: string | null,
  email?: string | null
) {
  const result = await updateLocalDb(async (state) => {
    const existing = state.parents.find((p) => p.nfcCode === nfcCode)
    if (existing) {
      throw new Error('Parent NFC code already registered')
    }

    const created = {
      id: nextId(state.parents),
      nfcCode,
      parentName,
      phone: phone || null,
      email: email || null,
      pickedUpAt: null,
      createdAt: new Date().toISOString(),
    }

    state.parents.push(created)
    return created
  })
  return result
}

export async function getParentByNfcCode(nfcCode: string) {
  const state = await readLocalDb()
  return state.parents.find((p) => p.nfcCode === nfcCode) || null
}

export async function getAllParents() {
  const state = await readLocalDb()
  return sortByCreatedAtDesc(state.parents)
}

// Student Photo operations
export async function uploadStudentPhoto(studentId: string, photoData: string) {
  const result = await updateLocalDb(async (state) => {
    // Remove old photo if exists
    const existingPhotoIdx = state.studentPhotos.findIndex(
      (p) => p.studentId === studentId
    )
    if (existingPhotoIdx !== -1) {
      state.studentPhotos.splice(existingPhotoIdx, 1)
    }

    const created = {
      id: nextId(state.studentPhotos),
      studentId,
      photoData,
      uploadedAt: new Date().toISOString(),
    }

    state.studentPhotos.push(created)
    return created
  })
  return result
}

export async function getStudentPhoto(studentId: string) {
  const state = await readLocalDb()
  return state.studentPhotos.find((p) => p.studentId === studentId) || null
}

// Student Child operations
export async function addStudentToParent(
  parentId: number,
  studentId: string,
  studentName: string,
  class_: string,
  block: string,
  nfcCode: string,
  photoId?: number | null
) {
  const result = await updateLocalDb(async (state) => {
    const existing = state.studentChildren.find(
      (c) => c.parentId === parentId && c.studentId === studentId
    )
    if (existing) {
      throw new Error('Student already linked to this parent')
    }

    const created = {
      id: nextId(state.studentChildren),
      parentId,
      studentId,
      studentName,
      class: class_,
      block,
      nfcCode,
      photoId: photoId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    state.studentChildren.push(created)
    return created
  })
  return result
}

export async function getChildrenByParentId(parentId: number) {
  const state = await readLocalDb()
  return state.studentChildren.filter(
    (c) => c.parentId === parentId && c.isActive
  )
}

export async function getChildrenAwaitingPickup(parentId: number) {
  const state = await readLocalDb()
  // Get children linked to this parent with status 'waiting'
  const children = state.studentChildren.filter(
    (c) => c.parentId === parentId && c.isActive
  )

  const withStatus = children.map((child) => {
    const dismissal = state.dismissals.find((d) => d.studentId === child.studentId)
    return {
      ...child,
      status: dismissal?.status || 'not_registered',
      dismissalId: dismissal?.id || null,
    }
  })

  return withStatus
}

export async function unlinkStudentFromParent(
  parentId: number,
  studentId: string
) {
  const result = await updateLocalDb(async (state) => {
    const child = state.studentChildren.find(
      (c) => c.parentId === parentId && c.studentId === studentId
    )

    if (!child) {
      throw new Error('Student not linked to this parent')
    }

    child.isActive = false
    return child
  })
  return result
}

export async function performMultiChildDismissal(
  parentId: number,
  selectedStudentIds: string[]
) {
  const result = await updateLocalDb(async (state) => {
    const nowIso = new Date().toISOString()
    const dismissed = []

    for (const studentId of selectedStudentIds) {
      const dismissal = state.dismissals.find((d) => d.studentId === studentId)

      if (dismissal) {
        dismissal.groundOpsTime = nowIso
        dismissal.finalDismissalTime = nowIso
        dismissal.status = 'completed'
        dismissal.pickedUpAt = nowIso
        dismissed.push(dismissal)
      }
    }

    // Update parent pickup time
    const parent = state.parents.find((p) => p.id === parentId)
    if (parent) {
      parent.pickedUpAt = nowIso
    }

    return dismissed
  })
  return result
}

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_USERNAME, nextId, sortByCreatedAtDesc }
