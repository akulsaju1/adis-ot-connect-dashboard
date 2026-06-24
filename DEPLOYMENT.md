# ADIS OT-Connect - Deployment Guide

## Complete Setup Instructions

The ADIS OT-Connect system is a full-stack Next.js application with Neon PostgreSQL backend and Better Auth authentication. Follow these steps to deploy and use the system.

---

## Prerequisites

- Vercel account (for deployment)
- Neon database account (PostgreSQL database)
- Node.js 18+ and pnpm installed

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd /vercel/share/v0-project
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local` file with:

```bash
# Database connection string from Neon
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?channel_binding=require&sslmode=require

# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-here
```

### 3. Run Dev Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

---

## Creating Admin Account

### Option 1: Using Admin Setup Page (Recommended for Development)

1. Navigate to `http://localhost:3000/admin-setup`
2. Click "+ Create Admin Account"
3. Use credentials to login:
   - Email: `admin@adis.ae`
   - Password: `Adis@2025`
4. After first login, **delete or password-protect** the `/admin-setup` page

### Option 2: Direct Database Entry (For Production/Testing)

Connect to your Neon database and run:

```sql
-- Create user
INSERT INTO "user" (id, email, emailVerified, name, createdAt, updatedAt)
VALUES (
  'admin-user-' || floor(random()*1000000)::text,
  'admin@adis.ae',
  true,
  'Admin Staff',
  now(),
  now()
)
ON CONFLICT(email) DO NOTHING;

-- Then create a session-based account (use Better Auth's password hashing)
-- Better Auth handles password hashing internally, so use the sign-up page instead
```

### Option 3: Using Sign-Up Page

1. Go to `http://localhost:3000/sign-up`
2. Sign up with:
   - Email: `admin@adis.ae`
   - Password: `Adis@2025`
   - Name: `Admin Staff`

---

## Dashboard Features

Once logged in, access:

| Section | Purpose |
|---------|---------|
| **Command Center** | Real-time dismissal metrics, NFC status, compliance log |
| **Gate Entrance** | NFC scanner for student arrivals, sibling detection |
| **Ground Operations** | Dismissal queue management by block (KG, Girls, Boys) |
| **Student Registry** | Register NFC tags, manage student records |
| **Staff Directory** | Manage staff members and contact information |

---

## Production Deployment to Vercel

### 1. Prepare GitHub Repository

```bash
git init
git add .
git commit -m "Initial ADIS OT-Connect deployment"
git remote add origin https://github.com/your-org/ot-connect.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Configure environment variables:
   - `DATABASE_URL`: Your production Neon connection string
   - `BETTER_AUTH_SECRET`: Generate secure key with `openssl rand -base64 32`
4. Click "Deploy"

### 3. Post-Deployment Setup

After deployment:

1. Navigate to your deployed URL: `https://your-domain.vercel.app/admin-setup`
2. Create admin account using the setup page
3. Test login at `/sign-in`
4. **Delete `/admin-setup` page** or password-protect it
5. Update default password to something secure

---

## Database Schema

The system uses Neon PostgreSQL with the following tables:

- `user` - User accounts (Better Auth)
- `session` - User sessions (Better Auth)
- `account` - Account credentials (Better Auth)
- `verification` - Email verification (Better Auth)
- `nfc_tags` - Student NFC tag mappings
- `dismissals` - Dismissal records and status tracking
- `staff_directory` - Staff member information

Indexes are created on:
- `dismissals.status`
- `dismissals.block`
- `dismissals.user_id`
- `nfc_tags.nfc_code`

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to version control
   - Use Vercel's environment variable UI for production

2. **Admin Setup Page**
   - Delete or password-protect after initial setup
   - Consider middleware to restrict access

3. **Database Security**
   - Use strong, unique passwords in connection strings
   - Enable Neon's SSL/TLS (already configured in connection string)
   - Regularly backup data

4. **Session Security**
   - `BETTER_AUTH_SECRET` should be 32+ characters
   - Regenerate in production
   - Use HTTPS only in production

5. **Staff Access**
   - Each staff member should have their own account
   - Use role-based access control when expanded
   - Regularly audit user activity

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# If using .env.local, ensure it's loaded
cat .env.local | grep DATABASE_URL
```

### Auth Not Working

1. Check `BETTER_AUTH_SECRET` is set (at least 32 characters)
2. Verify `DATABASE_URL` includes `sslmode=require`
3. Check Better Auth tables exist in database:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('user', 'session', 'account', 'verification');
   ```

### NFC Scanner Not Working

1. Browser must support Web NFC API (Chrome, Edge)
2. Device must have NFC hardware
3. Fallback to manual entry available on all pages

### Build Errors

```bash
# Clean and rebuild
pnpm install
pnpm clean
pnpm build
```

---

## Monitoring & Maintenance

### Regular Tasks

- Monitor Neon database logs for errors
- Review dismissal compliance logs weekly
- Update staff directory as personnel changes
- Backup NFC tag mappings regularly

### Performance Optimization

- Dashboard polls every 5 seconds for real-time updates
- Use browser's built-in dev tools to monitor performance
- Consider caching for frequently accessed data

---

## Support & Documentation

- Next.js: https://nextjs.org/docs
- Neon: https://neon.tech/docs
- Better Auth: https://www.better-auth.com
- Vercel: https://vercel.com/docs

---

## Version Information

- Node.js: 18+
- Next.js: 16.2.6
- React: 19.2
- Tailwind CSS: 4.0
- TypeScript: 5.9
- Drizzle ORM: Latest
- Better Auth: Latest
