# ADIS OT-Connect - Full-Stack Setup Guide

## Overview

ADIS OT-Connect is a complete NFC-based student dismissal management system for Abu Dhabi Indian School Al Wathba campus. It includes:

- **Authentication System**: Email + password via Better Auth
- **NFC Reader Integration**: Web NFC API for school-issued student tags
- **Real-Time Dashboard**: Command Center with live metrics
- **Gate Scanner**: NFC-based student arrival tracking
- **Ground Operations**: Dismissal queue management
- **Student Registry**: NFC tag registration & database
- **Staff Directory**: Admin staff management

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Backend**: Next.js Server Actions, Better Auth
- **Database**: Neon PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui with custom styling
- **Auth**: Better Auth (email/password, session-based)

## Project Structure

```
app/
  ├── layout.tsx                    # Root layout with metadata
  ├── page.tsx                      # Home (redirects to auth or dashboard)
  ├── api/auth/[...all]/route.ts   # Better Auth handler
  ├── command-center/page.tsx       # Live dismissal dashboard
  ├── gate-entrance/page.tsx        # NFC gate scanner
  ├── ground-ops/page.tsx           # Dismissal queue manager
  ├── student-registry/page.tsx     # Student registry & NFC registration
  ├── staff-directory/page.tsx      # Staff management
  ├── sign-in/page.tsx              # Sign in form
  ├── sign-up/page.tsx              # Sign up form
  └── actions/dismissal.ts          # Server actions for database operations
  
components/
  ├── sidebar.tsx                   # Main navigation sidebar
  ├── auth-form.tsx                 # Shared auth form component
  ├── command-center-dashboard.tsx  # Live metrics & NFC scanning
  ├── gate-entrance-scanner.tsx     # Gate scanner with NFC fallback
  ├── ground-ops-queue.tsx          # Queue management interface
  ├── student-registry.tsx          # Student database interface
  └── staff-directory.tsx           # Staff management interface

lib/
  ├── auth.ts                       # Better Auth configuration
  ├── auth-client.ts                # Client-side auth client
  ├── school-data.ts                # Mock data & utilities (optional)
  ├── db/
  │   ├── index.ts                  # Drizzle ORM setup
  │   └── schema.ts                 # Database schema
  └── utils.ts                      # Utility functions

public/
  └── [static assets]
```

## Database Schema

The system uses the following tables:

### Better Auth Tables (Auto-managed)
- `user`: User accounts
- `session`: Active sessions
- `account`: OAuth/provider accounts
- `verification`: Email verification tokens

### OT-Connect Tables
- `nfc_tags`: Registered NFC student tags
- `dismissals`: Student dismissal records with status tracking
- `staff_directory`: OT staff members and their roles

## Setup Instructions

### 1. Environment Variables

Create `.env.local` with:

```bash
# Database (from Neon)
DATABASE_URL=postgresql://user:password@host/dbname

# Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-key-here
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Migrations

The schema has already been created via the Neon MCP. Verify tables exist:

```bash
psql $DATABASE_URL -c "\dt"
```

Tables should include: `user`, `session`, `account`, `verification`, `nfc_tags`, `dismissals`, `staff_directory`

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` and create an account.

### 5. Deploy to Vercel

```bash
git push
# or
vercel deploy
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`: Your Neon connection string
- `BETTER_AUTH_SECRET`: Your secret key

## Using the System

### Sign Up & Sign In

1. Visit `/sign-up` to create an administrator account
2. Use your email and password to sign in
3. You'll be redirected to the Command Center

### Command Center Overview

- **Live Metrics**: Real-time dismissal status counts
- **NFC Reader**: Detects and processes NFC tag scans automatically
- **Live Log**: Shows recent dismissals with timestamps and statuses

### Gate Entrance Scanner

1. Staff member uses device with NFC reader at school gate
2. Students scan their NFC tag cards
3. System records gate arrival time
4. Student status updates to "at_gate"

### Ground Operations

1. View students waiting at gate
2. Confirm parent arrival (updates status to "parent_arrived")
3. Mark student as dismissed (updates to "completed")
4. Track dismissal completion metrics

### Student Registry

1. Register new students with their NFC codes
2. Assign to class and block (KG, Girls Block, Boys Block)
3. Store student information for quick lookups

### Staff Directory

1. Add staff members with roles (gate staff, ground ops, supervisor)
2. Assign to blocks
3. Store contact information
4. Mark as active/inactive

## NFC Integration

### For Development

Use the manual "NFC Code Entry" field in the Gate Entrance scanner to simulate NFC scans by typing student NFC codes directly.

### For Production (Phone NFC Reader)

The system supports the Web NFC API:
- Android devices with NFC enabled
- Scans NDEF-formatted NFC tags
- Automatically processes scans in Command Center and Gate Entrance

To test on a real device:
1. Ensure HTTPS is used (Vercel deployment)
2. Enable NFC on Android device
3. Tap NFC tag to the device back

## Key Features

### Security
- Better Auth manages password hashing and session security
- Database operations scoped to authenticated user (getUserId())
- CSRF protection via trusted origins
- Secure cookies with SameSite=None in development for iframe support

### Performance
- Server-rendered pages for fast initial loads
- Tailwind CSS v4 for optimized styling
- Drizzle ORM with indexed queries
- Static exports where possible

### Usability
- Dark Navy school-identity color scheme
- Status color indicators (Amber=waiting, Sky=at gate, Green=completed)
- Real-time data updates
- Responsive design for desktop and tablets

## Troubleshooting

### "Invalid origin" during signup

**Solution**: Ensure `BETTER_AUTH_URL`, `VERCEL_URL`, and `V0_RUNTIME_URL` are in `trustedOrigins` in `lib/auth.ts`.

### Database connection errors

**Solution**: 
1. Verify `DATABASE_URL` is set correctly
2. Check Neon database is running
3. Ensure IP/network firewall allows connections

### NFC not working

**Solution**:
1. Use manual entry field as fallback
2. Verify HTTPS in production (Web NFC requires secure context)
3. Check Android NFC is enabled

### Dismissals not updating

**Solution**:
1. Check browser console for errors
2. Verify database queries are correct with `SELECT * FROM dismissals LIMIT 5;`
3. Ensure userId matches session user

## File Locations for Customization

- **Colors & Theme**: `app/globals.css` (OKLch color tokens)
- **Navigation**: `components/sidebar.tsx`
- **Status Badges**: Color maps in component files
- **Auth Messages**: `components/auth-form.tsx`
- **Database Schema**: `lib/db/schema.ts`

## Future Enhancements

- [ ] Real-time push notifications for parents
- [ ] SMS/email notifications
- [ ] WhatsApp integration for parent pickup confirmation
- [ ] Analytics dashboard for dismissal patterns
- [ ] Multi-language support (Arabic/English)
- [ ] Mobile app via React Native
- [ ] Facial recognition verification
- [ ] API for third-party integrations

## Support

For issues or feature requests, contact the development team or file an issue in your version control system.

---

**Built with ❤️ for Abu Dhabi Indian School**  
*ADIS OT-Connect v1.0*
