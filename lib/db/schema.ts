import { pgTable, text, timestamp, boolean, serial } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Add your app tables below. Always include a plain `userId` column so queries
// can be scoped per user — the security model depends on this column existing,
// not on a foreign key. Do NOT add a foreign key constraint
// (`.references(() => user.id, ...)`) unless the user explicitly asks for
// foreign keys or referential integrity; FK constraints make iterating on the
// schema harder.
//
// OT-Connect dismissal system tables

export const nfcTags = pgTable('nfc_tags', {
  id: serial('id').primaryKey(),
  nfcCode: text('nfc_code').notNull().unique(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  class: text('class'),
  block: text('block'), // KG, Girls Block, Boys Block
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const dismissals = pgTable('dismissals', {
  id: serial('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  class: text('class'),
  block: text('block'),
  parentName: text('parent_name'),
  parentPhone: text('parent_phone'),
  pickupMethod: text('pickup_method'), // walk, car, driver
  nfcScanTime: timestamp('nfc_scan_time').defaultNow(),
  gateScanTime: timestamp('gate_scan_time'),
  groundOpsTime: timestamp('ground_ops_time'),
  finalDismissalTime: timestamp('final_dismissal_time'),
  status: text('status').notNull().default('waiting'), // waiting, at_gate, in_queue, parent_arrived, completed
  notes: text('notes'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const staffDirectory = pgTable('staff_directory', {
  id: serial('id').primaryKey(),
  staffName: text('staff_name').notNull(),
  role: text('role').notNull(), // gate_staff, ground_ops, supervisor
  block: text('block'),
  phone: text('phone'),
  email: text('email'),
  isActive: boolean('is_active').notNull().default(true),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
