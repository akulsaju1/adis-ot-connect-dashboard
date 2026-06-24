# Admin Account Setup

## Quick Start

The ADIS OT-Connect system requires an admin account to access the dismissal management dashboard.

### Step 1: Navigate to Setup Page

1. Open your browser and go to: `http://localhost:3000/admin-setup` (or your deployed domain + `/admin-setup`)
2. You'll see the Admin Account Setup page

### Step 2: Create Admin Account

Click the **"Create Admin Account"** button. This will create an account with:

- **Email:** admin@adis.ae
- **Password:** Adis@2025

### Step 3: Login

1. Go to `http://localhost:3000/sign-in` (or your deployed domain + `/sign-in`)
2. Enter the credentials:
   - Email: `admin@adis.ae`
   - Password: `Adis@2025`
3. Click "Sign in"

You'll be redirected to the Command Center dashboard.

## Important Security Notes

⚠️ **After completing setup:**

1. **Delete or password-protect** `/admin-setup` page to prevent unauthorized access
2. Change the default password immediately after first login (when available)
3. Never commit credentials to version control
4. Use strong, unique passwords for production deployments

## Troubleshooting

### "Admin account already exists"

The admin account has already been created. Just go to `/sign-in` and login with the credentials above.

### "Connection error" or "Failed to create account"

Make sure:
- Your Neon database is connected (check `DATABASE_URL` in `.env.local`)
- The Better Auth environment variables are set (`BETTER_AUTH_SECRET`)
- The dev server is running without errors

### Can't login with credentials

1. Make sure you're using the correct email: `admin@adis.ae`
2. Password is case-sensitive: `Adis@2025`
3. Check that `.env.local` has `DATABASE_URL` and `BETTER_AUTH_SECRET` set

## Dashboard Access

Once logged in, you can access:

- **Command Center** - Real-time dismissal overview
- **Gate Entrance** - NFC scanner for student arrivals
- **Ground Operations** - Manage dismissal queue
- **Student Registry** - Manage NFC tags and student records
- **Staff Directory** - Manage staff contacts

## Production Deployment

For production (Vercel deployment):

1. Set `DATABASE_URL` and `BETTER_AUTH_SECRET` as environment variables in Vercel project settings
2. Delete or disable the `/admin-setup` page
3. Use a secure, complex password instead of `Adis@2025`
4. Consider implementing two-factor authentication
