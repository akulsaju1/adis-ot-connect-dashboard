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

export interface LocalDbState {
  admin: LocalAdmin[]
  nfcTags: LocalNfcTag[]
  dismissals: LocalDismissal[]
  staffDirectory: LocalStaffMember[]
  dispersalSessions: DispersalSession[]
  pickupLogs: PickupLog[]
}

const emptyState = (): LocalDbState => ({
  admin: [],
  nfcTags: [],
  dismissals: [],
  staffDirectory: [],
  dispersalSessions: [],
  pickupLogs: [],
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

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_USERNAME, nextId, sortByCreatedAtDesc }
