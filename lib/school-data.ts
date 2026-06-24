export type Block = "KG" | "Girls" | "Boys"

export type StudentStatus =
  | "holding" // in holding area, parent not arrived
  | "dispatch" // parent tapped, in active pickup lane queue
  | "released" // security release confirmed / dispatched

export type DailyFlag = "Normal OT" | "After-School Activity" | "Temporary Bus Passenger"

export type EmiratesIdStatus = "Verified" | "Pending" | "Expired"

export type Lane = "Lane 1" | "Lane 2" | "Lane 3"

export interface Student {
  id: string
  name: string
  grNumber: string
  grade: string // e.g. "Grade 4", "KG1"
  section: string // e.g. "D"
  block: Block
  guardianId: string
  guardianName: string
  parentNfcUid: string
  studentNfcUid: string
  emiratesIdStatus: EmiratesIdStatus
  dailyFlag: DailyFlag
  status: StudentStatus
  lane?: Lane
  // for KG: the older sibling assigned to escort them
  escortSiblingId?: string
  arrivedAt?: number // timestamp when moved to dispatch
}

export interface Guardian {
  id: string
  name: string
  parentNfcUid: string
  childIds: string[]
}

export interface StaffMember {
  id: string
  name: string
  station: string
  role: "Admin" | "Teacher" | "Security Guard"
  status: "On Duty" | "Break" | "Off Duty"
}

export interface ComplianceAlert {
  id: string
  type: "Unregistered Guardian" | "Flagged Custody" | "Delayed Checkout" | "Sibling Mismatch"
  message: string
  severity: "high" | "medium" | "low"
  timestamp: number
}

// ---- Generators ----

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Reyansh", "Ishaan", "Kabir", "Ayaan",
  "Aanya", "Diya", "Saanvi", "Aadhya", "Anika", "Myra", "Sara", "Ira",
  "Rohan", "Krish", "Dev", "Yusuf", "Zara", "Fatima", "Hana", "Inaya",
  "Nikhil", "Karthik", "Meera", "Tara", "Veer", "Riya", "Advik", "Navya",
]

const LAST_NAMES = [
  "Sharma", "Verma", "Nair", "Menon", "Iyer", "Patel", "Reddy", "Khan",
  "Pillai", "Das", "Gupta", "Rao", "Joshi", "Kapoor", "Thomas", "Mathew",
  "Shetty", "Bose", "Chopra", "Malhotra", "Ahmed", "Hussain", "Krishnan",
]

const GUARDIAN_FIRST = [
  "Rajesh", "Suresh", "Mohammed", "Anand", "Vijay", "Sanjay", "Faisal", "Pradeep",
  "Priya", "Lakshmi", "Aisha", "Deepa", "Nisha", "Reema", "Sunita", "Farah",
]

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// deterministic-ish RNG seeded so SSR/CSR match
function makeRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function nfc(rng: () => number) {
  const hex = "0123456789ABCDEF"
  let out = ""
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 2 === 0) out += ":"
    out += hex[Math.floor(rng() * 16)] + hex[Math.floor(rng() * 16)]
  }
  return out.slice(0, 11)
}

const DAILY_FLAGS: DailyFlag[] = ["Normal OT", "Normal OT", "Normal OT", "After-School Activity", "Temporary Bus Passenger"]
const EID_STATUS: EmiratesIdStatus[] = ["Verified", "Verified", "Verified", "Pending", "Expired"]

export interface SchoolData {
  students: Student[]
  guardians: Guardian[]
  staff: StaffMember[]
}

export function generateSchoolData(): SchoolData {
  const rng = makeRng(20260610)
  const students: Student[] = []
  const guardians: Guardian[] = []

  const totalFamilies = 90
  let studentCounter = 1000

  for (let f = 0; f < totalFamilies; f++) {
    const last = pick(LAST_NAMES, rng)
    const guardianName = `${pick(GUARDIAN_FIRST, rng)} ${last}`
    const guardianId = `G-${4000 + f}`
    const parentNfcUid = nfc(rng)
    const numChildren = rng() < 0.35 ? (rng() < 0.5 ? 2 : 3) : 1
    const childIds: string[] = []

    for (let c = 0; c < numChildren; c++) {
      studentCounter++
      const id = `S-${studentCounter}`
      childIds.push(id)

      // assign block: KG, Girls, Boys
      const r = rng()
      let block: Block
      let grade: string
      if (r < 0.28) {
        block = "KG"
        grade = rng() < 0.5 ? "KG1" : "KG2"
      } else if (r < 0.64) {
        block = "Girls"
        grade = `Grade ${3 + Math.floor(rng() * 10)}`
      } else {
        block = "Boys"
        grade = `Grade ${3 + Math.floor(rng() * 10)}`
      }

      const section = String.fromCharCode(65 + Math.floor(rng() * 5)) // A-E
      const first = pick(FIRST_NAMES, rng)

      students.push({
        id,
        name: `${first} ${last}`,
        grNumber: `GR${20000 + studentCounter}`,
        grade,
        section,
        block,
        guardianId,
        guardianName,
        parentNfcUid,
        studentNfcUid: nfc(rng),
        emiratesIdStatus: pick(EID_STATUS, rng),
        dailyFlag: pick(DAILY_FLAGS, rng),
        status: "holding",
      })
    }

    // assign KG escort: if family has a KG child and an older child, link them
    const kgChild = students.find((s) => childIds.includes(s.id) && s.block === "KG")
    const olderChild = students.find((s) => childIds.includes(s.id) && s.block !== "KG")
    if (kgChild && olderChild) {
      kgChild.escortSiblingId = olderChild.id
    }

    guardians.push({ id: guardianId, name: guardianName, parentNfcUid, childIds })
  }

  const staff: StaffMember[] = [
    { id: "ST-01", name: "Mrs. Anjali Menon", station: "Gate 1", role: "Admin", status: "On Duty" },
    { id: "ST-02", name: "Mr. Imran Sheikh", station: "Gate 1", role: "Security Guard", status: "On Duty" },
    { id: "ST-03", name: "Ms. Kavya Rao", station: "KG Block", role: "Teacher", status: "On Duty" },
    { id: "ST-04", name: "Mr. Deepak Nair", station: "Boys Courtyard", role: "Security Guard", status: "On Duty" },
    { id: "ST-05", name: "Mrs. Sana Qureshi", station: "Girls Block", role: "Teacher", status: "On Duty" },
    { id: "ST-06", name: "Mr. Vivek Joshi", station: "Lane 1", role: "Security Guard", status: "Break" },
    { id: "ST-07", name: "Ms. Reema Thomas", station: "Lane 2", role: "Teacher", status: "On Duty" },
    { id: "ST-08", name: "Mr. Aslam Khan", station: "Lane 3", role: "Security Guard", status: "On Duty" },
    { id: "ST-09", name: "Dr. Priya Krishnan", station: "Command Center", role: "Admin", status: "On Duty" },
    { id: "ST-10", name: "Mrs. Hina Malik", station: "KG Block", role: "Teacher", status: "On Duty" },
    { id: "ST-11", name: "Mr. Tariq Hussain", station: "Gate 2", role: "Security Guard", status: "Off Duty" },
    { id: "ST-12", name: "Ms. Leena Pillai", station: "Girls Block", role: "Teacher", status: "On Duty" },
  ]

  return { students, guardians, staff }
}

// Scale displayed registered totals to feel enterprise-grade (3,300+ body)
export const TOTAL_STUDENT_BODY = 3318
