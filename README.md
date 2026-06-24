# ADIS OT-Connect: NFC-Based Student Dismissal System

## Overview

ADIS OT-Connect is a full-stack web application for managing student dismissals at Abu Dhabi Indian School. It leverages NFC (Near Field Communication) technology for seamless student identification and tracking, integrated with a comprehensive administrative dashboard for real-time monitoring.

Built with **Next.js 16**, **React 19**, **Neon PostgreSQL**, **Better Auth**, and **Tailwind CSS**, this system provides enterprise-grade reliability and security.

## Key Features

### 1. **Command Center Dashboard**
- Real-time live metrics displaying dismissal status distribution
- NFC reader status monitoring with active scanning indicator
- Live dismissal compliance log with detailed event tracking
- Performance analytics including:
  - Dismissal completion rate
  - Average processing time from scan to dismissal
  - Pending action count
- Real-time polling (5-second intervals) for live updates

### 2. **Gate Entrance NFC Scanner**
- Web NFC API integration for automatic student tag detection
- Manual entry fallback for devices without NFC support
- **Sibling Detection Logic**: Automatically alerts staff when multiple children from the same parent arrive within 30 seconds
- Real-time queue display of students currently at gate
- Scan history with timestamps

### 3. **Ground Operations Queue**
- Block-based organization (KG, Girls Block, Boys Block)
- Interactive queue management with quick-action buttons
- Parent arrival confirmation tracking
- Dismissal completion with timestamp recording
- Completion statistics dashboard
- Block filtering for targeted operations

### 4. **Student Registry**
- NFC tag registration and management
- Student database with search functionality
- Filter by class and block
- Automatic student profile creation
- Real-time registry updates

### 5. **Staff Directory**
- Staff member management with role-based organization
- Multiple staff roles: Gate Staff, Ground Operations, Supervisor
- Contact information management (phone, email)
- Search and filter capabilities
- Block assignment for staff members

### 6. **Authentication & Authorization**
- Email/password authentication via Better Auth
- Secure session management
- Role-based access control
- User-scoped data isolation

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19.2
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API

### Backend
- **Server**: Next.js Server Components & Route Handlers
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth
- **Server Actions**: For secure server-side operations

### Database Schema
- **users**: Authentication user management
- **sessions**: Session persistence for Better Auth
- **accounts**: OAuth account associations
- **verification**: Email verification tokens
- **nfc_tags**: Student NFC tag registry
- **dismissals**: Student dismissal tracking records
- **staff_directory**: Staff member information

## Project Structure

```
app/
├── layout.tsx                          # Root layout with app provider
├── page.tsx                            # Protected redirect to command center
├── api/
│   └── auth/[...all]/route.ts         # Better Auth handler
├── sign-in/
│   └── page.tsx                        # Sign-in page
├── sign-up/
│   └── page.tsx                        # Sign-up page
├── command-center/
│   └── page.tsx                        # Dashboard page
├── gate-entrance/
│   └── page.tsx                        # Gate scanner page
├── ground-ops/
│   └── page.tsx                        # Ground ops page
├── student-registry/
│   └── page.tsx                        # Registry page
├── staff-directory/
│   └── page.tsx                        # Directory page
└── actions/
    └── dismissal.ts                    # Server actions for data operations

components/
├── app-provider.tsx                    # Context provider wrapper
├── layout-wrapper.tsx                  # Reusable layout with sidebar
├── sidebar.tsx                         # Navigation sidebar
├── command-center-dashboard.tsx        # Command center UI
├── gate-entrance-scanner.tsx           # Gate scanner with NFC support
├── ground-ops-queue.tsx                # Ground ops management UI
├── student-registry.tsx                # Student management UI
├── staff-directory.tsx                 # Staff management UI
├── auth-form.tsx                       # Shared auth form
└── ui/
    └── button.tsx                      # Button component

lib/
├── auth.ts                             # Better Auth server config
├── auth-client.ts                      # Better Auth client
├── context/
│   └── app-context.tsx                # Application context provider
├── db/
│   ├── index.ts                        # Drizzle client setup
│   └── schema.ts                       # Database schema
└── school-data.ts                      # Mock data utilities

app/globals.css                         # Global styles with design tokens
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Neon PostgreSQL account
- Better Auth secret (generate: `openssl rand -base64 32`)

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here

# Optional: Custom auth URL
BETTER_AUTH_URL=https://yourdomain.com
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Schema

The database schema is automatically created via Neon MCP. Ensure your `DATABASE_URL` is correctly configured.

### 4. Run Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000`

### 5. Create Initial Account

1. Go to `/sign-up`
2. Create an admin account
3. You'll be redirected to the command center

## Usage Workflows

### Register a Student
1. Navigate to **Student Registry**
2. Fill in student details (name, class, block)
3. Provide NFC code (scan NFC tag or enter ID manually)
4. Click "Register Student"

### Scan at Gate
1. Navigate to **Gate Entrance Scanner**
2. Position student's NFC tag near NFC reader
3. System automatically registers student as "at_gate"
4. View queue of students ready for dismissal

### Process Dismissal
1. Navigate to **Ground Operations**
2. Filter by block if needed
3. For each student:
   - Click "Parent Arrived" when guardian appears
   - Click "Dismissed" when student leaves
4. Track completion progress

### Manage Staff
1. Navigate to **Staff Directory**
2. Click "Add Staff Member"
3. Enter staff details (name, role, contact)
4. Staff member is immediately available for dismissal operations

## API Endpoints

### Server Actions (in `app/actions/dismissal.ts`)

#### Dismissal Operations
- `scanNfcAtGate(nfcCode)` - Register student at gate
- `getDismissalsByStatus(status)` - Get dismissals by status
- `getAllDismissals()` - Get all dismissal records
- `getDismissalStats()` - Get dismissal statistics
- `updateDismissalStatus(id, status, updates)` - Update dismissal status

#### NFC & Student Management
- `registerNfcTag(code, studentId, name, class, block)` - Register NFC tag
- `getStudentByNfc(nfcCode)` - Look up student by NFC code

#### Staff Management
- `getStaffDirectory()` - Retrieve all staff
- `addStaffMember(name, role, block, phone, email)` - Add staff member

## Real-Time Features

### Polling Strategy
- Command Center: Polls every 5 seconds for live metrics
- Gate Entrance: Polls every 5 seconds for recent scans
- Ground Operations: Polls every 5 seconds for queue updates
- Polling stops on component unmount

### Live Metrics
- Total students in dismissal process
- Count by status: waiting, at_gate, in_queue, parent_arrived, completed
- Completion rate percentage
- Average processing time in minutes
- Pending actions count

## Security Features

### Authentication
- Better Auth with email/password
- Secure password hashing (bcrypt)
- Session tokens with expiration
- CSRF protection via headers

### Data Protection
- User-scoped queries using `userId` parameter
- All sensitive operations require authentication
- Server actions validate user session before execution
- Cross-origin requests blocked by default

### Database
- Parameterized queries prevent SQL injection
- Foreign key constraints maintain referential integrity
- Indexes on frequently queried fields

## Sibling Detection Logic

When a student is scanned at the gate, the system:
1. Checks for other students with the same parent name
2. Filters for scans within the last 30 seconds
3. Groups siblings together for admin visibility
4. Displays sibling groups with alert badge
5. Allows bulk operations on sibling groups

## Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Deploy via Vercel CLI or GitHub integration
```

### Environment Variables
Set in Vercel Project Settings:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret key

### Production Considerations
- Use `BETTER_AUTH_URL` for custom domains
- Enable CORS for specific origins
- Configure rate limiting
- Set up monitoring and logging
- Implement backup strategy for database

## Performance Optimizations

- **Server Components**: Leverages RSC for faster initial load
- **React Compiler**: Enabled for automatic memoization
- **Turbopack**: Next.js 16 default bundler
- **Polling Strategy**: Efficient 5-second intervals instead of WebSockets
- **Database Indexes**: On status, block, userId fields
- **Component Splitting**: Reusable components with clear responsibilities

## Known Limitations

- NFC support limited to HTTPS and specific browsers
- Real-time updates via polling (not WebSocket)
- Single database connection pool (no read replicas)
- No automated backup system

## Future Enhancements

- WebSocket integration for true real-time updates
- Email/SMS notifications for parents
- Mobile app for pickup notifications
- Attendance analytics and reporting
- Multi-language support (Arabic)
- Advanced filter/search capabilities
- User activity audit logging
- Bulk import from school system

## Troubleshooting

### NFC Not Working
- Ensure HTTPS connection (required by browser spec)
- Check browser support: Chrome 81+, Edge 81+
- Verify NFC hardware availability on device
- Try manual entry fallback

### Database Connection Error
- Verify `DATABASE_URL` is correct
- Check network connectivity to Neon
- Ensure database exists and tables created
- Review PostgreSQL logs

### Authentication Issues
- Confirm `BETTER_AUTH_SECRET` is set
- Check session cookie in browser DevTools
- Verify `BETTER_AUTH_URL` matches origin
- Try clearing browser cookies

## Support

For issues, feature requests, or questions:
1. Check the setup guide in `SETUP.md`
2. Review component documentation in component files
3. Check server action implementations
4. Contact ADIS IT administration

## License

Proprietary - Abu Dhabi Indian School

## Version

1.0.0 - Initial Release
