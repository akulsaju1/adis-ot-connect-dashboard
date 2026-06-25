# ADIS OT Connect Dashboard - Raspberry Pi Setup Guide

This guide provides step-by-step instructions to run the ADIS OT Connect Dashboard on a Raspberry Pi with all data stored locally.

## System Requirements

- **Raspberry Pi 4B or newer** (4GB RAM minimum, 8GB recommended)
- **Raspberry Pi OS Lite or Desktop** (64-bit recommended)
- **MicroSD Card** (32GB or larger)
- **Internet connection** (for initial setup)

## Prerequisites Installation

### 1. Update System Packages
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js (v20 LTS - Recommended for Raspberry Pi)
```bash
# Install Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js v20 LTS
nvm install 20
nvm use 20
node -v  # Verify installation
```

### 3. Install PNPM (Faster package manager)
```bash
npm install -g pnpm@9
pnpm -v  # Verify installation
```

### 4. Install Build Tools (Required for native modules)
```bash
sudo apt install -y build-essential python3 git
```

## Project Setup

### 1. Clone the Repository
```bash
cd ~
git clone https://github.com/akulsaju1/adis-ot-connect-dashboard.git
cd adis-ot-connect-dashboard
```

### 2. Install Dependencies
```bash
pnpm install
```

This will install all required packages for the Next.js application.

### 3. Create Environment File
```bash
cat > .env.local << 'EOF'
# Local Development Settings
NODE_ENV=production
DATABASE_URL="local"

# Better Auth Configuration (required for auth)
BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# For local Raspberry Pi hosting
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

# Local data directory (stores all data on Pi)
LOCAL_DB_DIR=/home/pi/adis-ot-data/.data
EOF
```

### 4. Create Data Directory
```bash
# Create persistent data storage directory
mkdir -p /home/pi/adis-ot-data/.data
chmod 755 /home/pi/adis-ot-data

# Make sure the app can write to it
sudo chown -R pi:pi /home/pi/adis-ot-data
```

### 5. Build the Application
```bash
pnpm build
```

On a Raspberry Pi 4, this may take 5-10 minutes. Be patient.

## Running the Application

### Option A: Manual Start (for testing)
```bash
pnpm start
```

The application will start on `http://localhost:3000`

Access it from:
- **Local Pi**: `http://localhost:3000`
- **Other devices on network**: `http://<PI_IP>:3000`

Find your Pi's IP address with:
```bash
hostname -I
```

### Option B: Auto-Start as System Service (Recommended)

#### Create systemd service file:
```bash
sudo tee /etc/systemd/system/adis-ot-connect.service > /dev/null << 'EOF'
[Unit]
Description=ADIS OT Connect Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/adis-ot-connect-dashboard
Environment="NODE_ENV=production"
Environment="LOCAL_DB_DIR=/home/pi/adis-ot-data/.data"
ExecStart=/home/pi/.nvm/versions/node/v20.10.0/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

#### Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable adis-ot-connect
sudo systemctl start adis-ot-connect

# Check status
sudo systemctl status adis-ot-connect

# View logs
sudo journalctl -u adis-ot-connect -f
```

### Option C: Run in Background with PM2 (Alternative)

```bash
# Install PM2 globally
sudo pnpm install -g pm2

# Start the application
pm2 start pnpm --name "adis-ot-connect" -- start

# Auto-start on reboot
pm2 startup
pm2 save
```

## Data Storage

All application data is stored locally in:
```
/home/pi/adis-ot-data/.data/local-db.json
```

### Backup Your Data
```bash
# Create a backup
cp -r /home/pi/adis-ot-data /home/pi/adis-ot-data-backup-$(date +%Y%m%d)

# Automated daily backups (add to crontab)
crontab -e
# Add this line:
# 0 2 * * * cp -r /home/pi/adis-ot-data /home/pi/backups/adis-ot-data-backup-$(date +\%Y\%m\%d)
```

## Default Credentials

**Admin Account (Local Database):**
- Username: `admin`
- Email: `admin@adis.ae`
- Password: `admin` (first login, you should change this)

**URL:** `http://localhost:3000` or `http://<PI_IP>:3000`

## Network Access

### Enable Remote Access (Same Network)
The application is automatically accessible to other devices on your network:
```
http://<RASPBERRY_PI_IP>:3000
```

### Enable Port Forwarding (Optional - For External Access)
⚠️ **Security Warning**: Only do this if you understand the security implications.

1. Log into your router
2. Find Port Forwarding settings
3. Forward port 3000 to your Raspberry Pi's local IP on port 3000
4. Access via: `http://<YOUR_ROUTER_IP>:3000`

## Performance Optimization on Raspberry Pi

The application is optimized for Raspberry Pi:

- **Lightweight Next.js Setup**: Uses Node.js pool connection instead of heavy database
- **Local-First Architecture**: All data stored in JSON, no remote API calls
- **Minimal Dependencies**: Only essential packages included
- **Memory Efficient**: Uses streaming for large data operations

### Monitor Resource Usage
```bash
# Check CPU and memory
top

# Monitor disk usage
df -h

# Check application memory (if using PM2)
pm2 monit
```

## Troubleshooting

### Application won't start
```bash
# Check logs
sudo journalctl -u adis-ot-connect -n 50

# Verify data directory exists and is writable
ls -la /home/pi/adis-ot-data

# Ensure Node.js and dependencies are installed
node -v
pnpm list | head -20
```

### Can't access from other devices
```bash
# Check if service is running
sudo systemctl status adis-ot-connect

# Check if port 3000 is listening
sudo netstat -tuln | grep 3000

# Or
sudo ss -tuln | grep 3000

# Verify firewall allows port 3000
sudo ufw status
sudo ufw allow 3000
```

### Data directory permission issues
```bash
# Fix permissions
sudo chown -R pi:pi /home/pi/adis-ot-data
chmod 755 /home/pi/adis-ot-data
chmod 644 /home/pi/adis-ot-data/.data/local-db.json
```

### Out of memory issues
```bash
# Increase swap (if needed)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Verify
free -h
```

## Updates and Maintenance

### Update the Application
```bash
cd /home/pi/adis-ot-connect-dashboard
git pull origin main
pnpm install
pnpm build
sudo systemctl restart adis-ot-connect
```

### Database Maintenance
The local JSON database is self-maintained. For large deployments (>10,000 records), consider:

1. Regular backups (automated)
2. Periodic data archival
3. Monitoring file size: `/home/pi/adis-ot-data/.data/local-db.json`

### Log Management
```bash
# View application logs
sudo journalctl -u adis-ot-connect -f

# Clear old logs
sudo journalctl --vacuum-time=30d
```

## Advanced Configuration

### Custom Port (if 3000 is in use)
Edit `/etc/systemd/system/adis-ot-connect.service`:
```
ExecStart=/home/pi/.nvm/versions/node/v20.10.0/bin/pnpm start -- -p 8080
```

### SSL/HTTPS Setup (Optional)
For production access, use Let's Encrypt with Nginx reverse proxy:
```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure reverse proxy
# (See Nginx configuration section below)
```

### Nginx Reverse Proxy Configuration
```nginx
# /etc/nginx/sites-available/adis-ot-connect

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Recommendations

1. **Change default credentials immediately**
2. **Use strong passwords** for admin accounts
3. **Keep Raspberry Pi OS updated**: `sudo apt update && sudo apt upgrade`
4. **Restrict SSH access**: Use key-based authentication
5. **Enable firewall**: `sudo ufw enable`
6. **Use HTTPS in production**: Set up SSL with Let's Encrypt
7. **Regular backups**: Automate data backups to external storage
8. **Monitor access logs**: Check for unauthorized access attempts

## Support & Documentation

- Next.js Documentation: https://nextjs.org/docs
- Raspberry Pi Documentation: https://www.raspberrypi.com/documentation/
- Application Source: https://github.com/akulsaju1/adis-ot-connect-dashboard
