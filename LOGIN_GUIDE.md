# ADIS OT-Connect - Login System

## Quick Start

### Credentials
- **Username:** `admin`
- **Password:** `Adis@2025`

## How to Access

### 1. Start the Application
```bash
cd /vercel/share/v0-project
pnpm dev
```

### 2. Go to Login Page
Navigate to: `http://localhost:3000`
- This will automatically redirect to `/login`

### 3. Enter Credentials
- Enter `admin` as username
- Enter `Adis@2025` as password
- Click Login

### 4. Access Portals
Once logged in, you can access all portals:

| Portal | URL | Description |
|--------|-----|-------------|
| **Command Center** | `/command-center` | Real-time monitoring and NFC management |
| **Gate Entrance** | `/gate-entrance` | NFC student scanning at gate |
| **Ground Operations** | `/ground-ops` | Student queuing and dispatch |
| **Student Registry** | `/student-registry` | Student and NFC tag management |
| **Staff Directory** | `/staff-directory` | Staff member management |

## Features

### Authentication
- Simple username/password login
- Session-based authentication using cookies
- Protected routes redirect unauthenticated users to login
- Sign Out button in sidebar for all portals

### Security
- Password hashing with bcryptjs
- Database-backed user storage in Neon PostgreSQL
- Session validation on each request
- Automatic logout redirect when accessing protected pages

### Database
- Admin user stored in `admin` table
- Credentials: `username='admin'`, `password='[bcrypt_hashed]'`

## Troubleshooting

### Login Not Working
1. Verify the dev server is running: `pnpm dev`
2. Check DATABASE_URL in `.env.local`
3. Ensure admin user exists in database

### Can't Access Portals
1. You must be logged in - redirects to login page if not authenticated
2. Log in with `admin/Adis@2025`

### Need to Change Password
Contact your administrator to update the password hash in the admin table.

## Database Setup

The admin table is automatically created with:
```sql
CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO admin (username, password, name) 
VALUES ('admin', '$2b$10$yPr0nv1mgNh.NNa77/YHl.LSpp8ruyJWBKapzWEAN0NPQBQG0uC.G', 'Admin Staff');
```

## Environment Variables Required

### .env.local
```
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
BETTER_AUTH_SECRET=[optional, can be removed]
```

## API Endpoints

### Login
- **POST** `/api/login`
- Body: `{ username: string, password: string }`
- Returns: Session cookie

### Logout
- **POST** `/api/logout`
- Returns: Clears session cookie

## Session Management

- Sessions are stored in cookies (HTTP-only)
- Each request validates the session on the server
- Session automatically expires after inactivity (configurable)
- Sign Out button explicitly clears the session

## Production Notes

1. Change the default password before deploying
2. Use HTTPS in production
3. Set secure cookie flags for production
4. Consider implementing 2FA for higher security
5. Regularly audit login attempts and access logs
