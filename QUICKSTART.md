# ADIS OT-Connect - Quick Start Guide

## Admin Login Credentials

Use these credentials to access the system:

| Field | Value |
|-------|-------|
| **Email** | admin@adis.ae |
| **Password** | Adis@2025 |

---

## Getting Started in 3 Steps

### Step 1: Create Admin Account

**Local Development:**
```bash
npm run dev
# or
pnpm dev
```

Then go to: `http://localhost:3000/admin-setup`

Click the **"+ Create Admin Account"** button.

**Production (Vercel):**
Go to: `https://your-domain.vercel.app/admin-setup`

Click the **"+ Create Admin Account"** button.

### Step 2: Login

Navigate to `/sign-in` and enter:
- Email: `admin@adis.ae`
- Password: `Adis@2025`

### Step 3: Start Managing Dismissals

You'll be taken to the Command Center dashboard with access to:
- 📊 Command Center (overview & compliance)
- 🎫 Gate Entrance (NFC scanner)
- 📋 Ground Operations (dismissal queue)
- 👥 Student Registry (NFC tags)
- 👔 Staff Directory (staff contacts)

---

## Key Features

### Command Center
- **Live Metrics**: Total, waiting, at gate, in queue, completed
- **Completion Rate**: Percentage of dismissals processed
- **Processing Time**: Average time from NFC scan to dismissal
- **Real-time Updates**: 5-second polling
- **Compliance Log**: Full audit trail of all actions

### Gate Entrance Scanner
- **NFC Detection**: Automatic student arrival detection
- **Sibling Alerts**: Notifies when multiple children from same family arrive
- **Manual Fallback**: Entry input for devices without NFC
- **Block Assignment**: Tracks which school block student is from

### Ground Operations
- **Block Filtering**: View queue by KG, Girls Block, or Boys Block
- **Queue Management**: Drag-and-drop to organize dismissals
- **Parent Arrival**: Mark when parent arrives for pickup
- **Quick Dismissal**: Process multiple students efficiently

### Student Registry
- **NFC Registration**: Register student NFC codes
- **Search & Filter**: Find students by name or class
- **Block Organization**: Separate students by building
- **Bulk Management**: Add multiple students at once

### Staff Directory
- **Staff Profiles**: Name, role, contact info
- **Role Management**: Gate staff, ground ops, supervisors
- **Search Function**: Find staff by name or email
- **Block Assignment**: Assign staff to specific areas

---

## Database Setup

The system automatically sets up tables when you deploy:

1. **User Management** (Better Auth)
   - Users
   - Sessions
   - Accounts
   - Verifications

2. **Dismissal System**
   - NFC Tags (student registrations)
   - Dismissals (audit log)
   - Staff Directory

**Environment Variables Required:**
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=[your-secret-key]
```

Generate secret: `openssl rand -base64 32`

---

## Next Steps

1. **First Login**: Use admin@adis.ae / Adis@2025
2. **Register Students**: Go to Student Registry to add NFC tags
3. **Add Staff**: Go to Staff Directory to add staff members
4. **Configure NFC**: Test scanner at Gate Entrance
5. **Security**: Delete /admin-setup page after setup

---

## Support

For detailed setup, deployment, and troubleshooting, see:
- `SETUP.md` - Database and auth setup
- `DEPLOYMENT.md` - Production deployment guide
- `ADMIN_LOGIN.md` - Admin account troubleshooting
- `README.md` - Complete project documentation

---

## Important Security Notes

⚠️ **After First Login:**

1. Delete or password-protect the `/admin-setup` page
2. Change the default password when feature is available
3. Never share these credentials
4. Use HTTPS only in production
5. Keep `BETTER_AUTH_SECRET` secure

For production security best practices, see `DEPLOYMENT.md`.
