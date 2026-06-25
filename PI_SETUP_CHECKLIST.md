# ADIS OT Connect Dashboard - Raspberry Pi Setup Checklist

Use this checklist to ensure proper installation and configuration on your Raspberry Pi.

## Pre-Installation Phase

### Hardware Setup
- [ ] Raspberry Pi 4B or newer (4GB RAM minimum)
- [ ] MicroSD card 32GB or larger
- [ ] Power supply (5V 3A minimum)
- [ ] Ethernet cable or WiFi connection
- [ ] Monitor and keyboard for initial setup (or SSH access)

### OS Installation
- [ ] Download Raspberry Pi OS (64-bit recommended)
- [ ] Flash to MicroSD card using Raspberry Pi Imager
- [ ] Boot Pi and complete initial setup wizard
- [ ] Update system: `sudo apt update && sudo apt upgrade`
- [ ] Enable SSH (if headless): `sudo raspi-config`

### Pre-Installation Checks
- [ ] Verify SSH access works: `ssh pi@<pi-ip>`
- [ ] Check internet connection: `ping 8.8.8.8`
- [ ] Verify disk space: `df -h` (at least 20GB free)
- [ ] Check RAM: `free -h` (at least 2GB available)

---

## Automatic Installation (Recommended)

### Quick Setup (One Command)
```bash
cd ~/adis-ot-connect-dashboard
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

### During Setup, You'll Be Asked:
- [ ] Review system update process (may take 10+ minutes)
- [ ] Confirm Node.js installation
- [ ] Confirm PNPM installation
- [ ] Confirm dependency installation (may take 15+ minutes)
- [ ] Confirm build process (may take 5-10 minutes)
- [ ] Choose: Install as systemd service? (Recommended: YES)

### Post-Setup Verification
- [ ] Service is running: `sudo systemctl status adis-ot-connect`
- [ ] Application accessible: `curl http://localhost:3000`
- [ ] Can access from other device: `http://<pi-ip>:3000`
- [ ] Admin login works with credentials:
  - Username: `admin`
  - Email: `admin@adis.ae`
  - Password: `admin`

---

## Manual Installation (If Needed)

### Step 1: Install Prerequisites
- [ ] Build tools: `sudo apt install -y build-essential python3 git curl`
- [ ] Node.js v20: Follow NVM installation or direct binary download
- [ ] PNPM: `npm install -g pnpm@9`
- [ ] Verify: `node -v`, `pnpm -v`, `git -v`

### Step 2: Clone Repository
- [ ] Clone repo: `git clone https://github.com/akulsaju1/adis-ot-connect-dashboard.git`
- [ ] Navigate: `cd adis-ot-connect-dashboard`
- [ ] Check branch: `git branch -v` (should be main)

### Step 3: Create Data Directory
- [ ] Create directory: `mkdir -p /home/pi/adis-ot-data/.data`
- [ ] Set permissions: `chmod 755 /home/pi/adis-ot-data`
- [ ] Verify writable: `touch /home/pi/adis-ot-data/.data/test.txt`

### Step 4: Configure Environment
- [ ] Copy example: `cp .env.pi.example .env.local`
- [ ] Edit `.env.local` with correct values:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL=local`
  - [ ] `BETTER_AUTH_SECRET=` (generate: `openssl rand -base64 32`)
  - [ ] `LOCAL_DB_DIR=/home/pi/adis-ot-data/.data`

### Step 5: Install & Build
- [ ] Install dependencies: `pnpm install` (15-30 min)
- [ ] Build application: `pnpm build` (5-10 min)
- [ ] Check for errors in build output

### Step 6: Service Setup (Optional but Recommended)
- [ ] Copy service file: `sudo cp scripts/adis-ot-connect.service /etc/systemd/system/`
- [ ] Reload systemd: `sudo systemctl daemon-reload`
- [ ] Enable service: `sudo systemctl enable adis-ot-connect`
- [ ] Start service: `sudo systemctl start adis-ot-connect`
- [ ] Verify running: `sudo systemctl status adis-ot-connect`

---

## Post-Installation Configuration

### Security - Change Default Credentials
- [ ] Access application: `http://localhost:3000` or `http://<pi-ip>:3000`
- [ ] Log in with: `admin` / `admin`
- [ ] Navigate to admin settings
- [ ] Change admin password to strong unique password
- [ ] Record new password in secure location
- [ ] Verify new password works on next login

### Backup Setup
- [ ] Run cron setup: `./scripts/setup-cron.sh`
- [ ] Verify cron jobs: `crontab -l`
- [ ] Check backup directory exists: `ls -la /home/pi/adis-ot-backups/`
- [ ] Manual backup test: `./scripts/backup-data.sh`
- [ ] Verify backup file created: `ls -lh /home/pi/adis-ot-backups/`

### Network Configuration
- [ ] Firewall enabled: `sudo ufw status`
- [ ] Port 3000 allowed: `sudo ufw allow 3000`
- [ ] Find Pi IP: `hostname -I`
- [ ] Test access from other device: `http://<pi-ip>:3000`
- [ ] Document Pi IP address for reference

### Monitoring Setup
- [ ] Test monitor script: `./scripts/monitor-pi.sh`
- [ ] Set up auto-refresh: `watch -n 5 ./scripts/monitor-pi.sh`
- [ ] View logs: `sudo journalctl -u adis-ot-connect -f`
- [ ] Monitor exits cleanly: Press Ctrl+C

---

## Data Import (Optional)

### If Migrating Existing Data
- [ ] Prepare data export from previous system (if applicable)
- [ ] Stop service: `sudo systemctl stop adis-ot-connect`
- [ ] Import data to database: (custom import script)
- [ ] Verify data imported: `jq '.admin | length' /home/pi/adis-ot-data/.data/local-db.json`
- [ ] Restart service: `sudo systemctl start adis-ot-connect`
- [ ] Test in UI: Verify records appear

---

## First-Week Maintenance

### Day 1: Verify Installation
- [ ] Application starts after reboot: `sudo reboot` then check
- [ ] Can access from multiple devices on network
- [ ] Monitor shows healthy resource usage: `./scripts/monitor-pi.sh`
- [ ] Can create test admin account
- [ ] Can view logs: `sudo journalctl -u adis-ot-connect -f`

### Day 2-3: Test Functionality
- [ ] Add test NFC tags
- [ ] Create test dismissal record
- [ ] Add staff member
- [ ] Test search/filter functionality
- [ ] Verify data persists after refresh

### Day 4-7: Backup Testing
- [ ] Manual backup created: `./scripts/backup-data.sh`
- [ ] Verify backup file size is reasonable (should be small)
- [ ] Test restore from backup (on test system or temporarily)
- [ ] Verify automatic backup runs (check `/home/pi/adis-ot-backups/`)
- [ ] Review backup logs: `tail -f /home/pi/adis-ot-backups/cron.log`

---

## Weekly Maintenance

### Performance Check
- [ ] Resource usage normal: `./scripts/monitor-pi.sh`
- [ ] Disk space available: `df -h /home/pi` (should have >5GB free)
- [ ] Database file size reasonable: `du -h /home/pi/adis-ot-data/.data/local-db.json`
- [ ] No error logs: `sudo journalctl -u adis-ot-connect --since "7 days ago" | grep ERROR`

### Backup Verification
- [ ] Backup created recently: `ls -lh /home/pi/adis-ot-backups/ | head -5`
- [ ] Backup file size consistent (within 10% of previous)
- [ ] No backup errors: `tail /home/pi/adis-ot-backups/cron.log`
- [ ] Oldest backup older than 7 days (to verify retention)

### System Health
- [ ] No service crashes: `sudo journalctl -u adis-ot-connect | grep -i "restart\|fail"`
- [ ] Temperature normal: `vcgencmd measure_temp` (should be <60°C)
- [ ] SSH access working normally
- [ ] Network connectivity stable

---

## Monthly Maintenance

### System Updates
- [ ] Update OS: `sudo apt update && sudo apt upgrade`
- [ ] Check node/npm updates (optional): `npm -g outdated`
- [ ] Reboot after updates: `sudo reboot`
- [ ] Verify application still running: `sudo systemctl status adis-ot-connect`

### Backup Management
- [ ] Review backup directory: `ls -lh /home/pi/adis-ot-backups/`
- [ ] Verify old backups deleted (older than 30 days): `find /home/pi/adis-ot-backups -name "*.tar.gz" -mtime +30`
- [ ] Consider external backup: Copy backups to external storage
- [ ] Test restore process on alternate system

### Data Validation
- [ ] Validate database integrity: `jq empty /home/pi/adis-ot-data/.data/local-db.json`
- [ ] Check record counts: `jq '.dismissals | length' /home/pi/adis-ot-data/.data/local-db.json`
- [ ] Review unusual activity in logs: `sudo journalctl -u adis-ot-connect --since "30 days ago" | grep -i "error\|warning"`

### Documentation
- [ ] Update records of any issues encountered
- [ ] Document any customizations made
- [ ] Review and update network documentation
- [ ] Verify admin account backup/recovery process

---

## Troubleshooting Checklist

### If Application Won't Start
- [ ] Check service status: `sudo systemctl status adis-ot-connect`
- [ ] View error logs: `sudo journalctl -u adis-ot-connect -n 50`
- [ ] Verify port not in use: `sudo ss -tuln | grep 3000`
- [ ] Check data directory exists: `ls -la /home/pi/adis-ot-data/.data/`
- [ ] Check disk space: `df -h /home/pi`
- [ ] Verify permissions: `ls -la /home/pi/adis-ot-data/.data/local-db.json`
- [ ] Try manual start: `cd /home/pi/adis-ot-connect-dashboard && pnpm start`

### If Can't Access from Network
- [ ] Check firewall: `sudo ufw status`
- [ ] Allow port 3000: `sudo ufw allow 3000`
- [ ] Verify service running: `sudo systemctl status adis-ot-connect`
- [ ] Get Pi IP: `hostname -I`
- [ ] Test from Pi: `curl http://localhost:3000`
- [ ] Ping from other device: `ping <pi-ip>`
- [ ] Restart service: `sudo systemctl restart adis-ot-connect`

### If Performance Issues
- [ ] Check resources: `./scripts/monitor-pi.sh`
- [ ] Check CPU usage: `top`
- [ ] Check memory: `free -h`
- [ ] Check disk I/O: `iostat -x 1 5`
- [ ] Check database size: `du -h /home/pi/adis-ot-data/.data/local-db.json`
- [ ] Increase swap if needed (see TROUBLESHOOTING.md)
- [ ] Check for excessive logs: `journalctl -u adis-ot-connect -f`

### If Data Issues
- [ ] Backup current data: `./scripts/backup-data.sh`
- [ ] Validate JSON: `jq empty /home/pi/adis-ot-data/.data/local-db.json`
- [ ] Check backup exists: `ls -la /home/pi/adis-ot-backups/`
- [ ] Restore from backup (CAREFULLY): See RASPBERRY_PI_SETUP.md
- [ ] Verify restore: Check data in UI
- [ ] Review error logs for cause

---

## Disaster Recovery Checklist

### If System Fails to Boot
- [ ] Verify power supply connected
- [ ] Check SD card not corrupted
- [ ] Try reseating SD card
- [ ] Flash fresh OS if needed
- [ ] Have recent backup ready to restore

### If Data is Corrupted
- [ ] Do NOT overwrite backup
- [ ] Stop application: `sudo systemctl stop adis-ot-connect`
- [ ] Restore from backup: See TROUBLESHOOTING.md
- [ ] Verify restore successful
- [ ] Restart service: `sudo systemctl start adis-ot-connect`

### If Backups are Missing
- [ ] Check backup directory: `ls -la /home/pi/adis-ot-backups/`
- [ ] Check cron logs: `tail /home/pi/adis-ot-backups/cron.log`
- [ ] Manually create backup: `./scripts/backup-data.sh`
- [ ] Verify backup created
- [ ] Re-enable cron: `./scripts/setup-cron.sh`

### If Ransomware/Security Breach Suspected
- [ ] Disconnect network immediately (unplug ethernet or disable WiFi)
- [ ] Shut down Pi: `sudo shutdown -h now`
- [ ] Remove SD card
- [ ] Mount SD card on safe computer
- [ ] Make backup copy of data for forensics
- [ ] Restore from known-good backup
- [ ] Re-image OS if necessary
- [ ] Change all passwords
- [ ] Review logs for suspicious activity

---

## Sign-Off

Complete this section once fully set up:

- [ ] Installation completed successfully
- [ ] Default password changed
- [ ] Application accessible locally and remotely
- [ ] Automated backups configured
- [ ] First week tests completed
- [ ] Documentation reviewed and saved
- [ ] Contact person identified for issues
- [ ] Backup location documented
- [ ] Recovery procedure tested

**Setup Completed By**: ____________________

**Date**: ____________________

**System Details**:
- Pi Model: ____________________
- IP Address: ____________________
- OS Version: ____________________
- Node Version: ____________________

**Notes**: ____________________

---

See `RASPBERRY_PI_SETUP.md`, `TROUBLESHOOTING.md`, and `PI_DEPLOYMENT_SUMMARY.md` for detailed information.
