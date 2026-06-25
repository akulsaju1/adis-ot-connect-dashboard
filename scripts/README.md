# ADIS OT Connect Dashboard - Raspberry Pi Scripts

This directory contains helper scripts for running the application on Raspberry Pi.

## Quick Start

Run the automated setup on your Raspberry Pi:

```bash
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

This script will:
- Update system packages
- Install Node.js v20 LTS
- Install PNPM
- Create data directory
- Install dependencies
- Build the application
- Optionally install as system service

## Available Scripts

### 1. setup-pi.sh
**One-time initial setup automation**

```bash
./scripts/setup-pi.sh
```

**What it does:**
- Updates Raspberry Pi OS
- Installs Node.js, build tools, and PNPM
- Creates persistent data storage directory
- Installs npm dependencies
- Builds the application
- Optionally installs as systemd service

**Time**: 15-30 minutes (depending on Pi speed)

---

### 2. backup-data.sh
**Backs up all application data with compression**

```bash
./scripts/backup-data.sh
```

**What it does:**
- Creates timestamped backup of `/home/pi/adis-ot-data/.data/`
- Compresses to `.tar.gz` for space efficiency
- Automatically removes backups older than 30 days
- Saves to `/home/pi/adis-ot-backups/`

**Example output:**
```
Data directory: /home/pi/adis-ot-data/.data
Destination: /home/pi/adis-ot-backups/adis-ot-backup_20240101_020000.tar.gz
Size: 2.3 MB
```

**Restore from backup:**
```bash
cd /tmp
tar -xzf /home/pi/adis-ot-backups/adis-ot-backup_20240101_020000.tar.gz
cp local-db.json /home/pi/adis-ot-data/.data/
```

---

### 3. monitor-pi.sh
**Real-time system and application monitoring**

```bash
./scripts/monitor-pi.sh
```

**Or watch with auto-refresh:**
```bash
watch -n 5 ./scripts/monitor-pi.sh
```

**Displays:**
- Service status (running/stopped)
- CPU usage percentage
- Memory usage and free space
- Disk usage for `/home/pi`
- CPU temperature
- Database file size
- Record counts (admins, NFC tags, etc.)
- Network IP and URL
- Recent application logs

**Example output:**
```
Service Status:
  Application: ● Running

System Resources:
  CPU Usage: 15%
  Memory: 256 MB / 3.8 GB (6%)
  Free: 3.5 GB
  Disk (home): 4.2 GB / 128 GB (3%)
  Temperature: 42.5°C
```

---

### 4. setup-cron.sh
**Configure automated backup and maintenance tasks**

```bash
./scripts/setup-cron.sh
```

**What it sets up:**
- **Daily backup at 2:00 AM**: Automatically backs up all data
- **Weekly restart every Monday at 6:00 AM**: Keeps system fresh

**Verify cron jobs:**
```bash
crontab -l
```

**View cron execution logs:**
```bash
tail -f /home/pi/adis-ot-backups/cron.log
```

**Edit manually:**
```bash
crontab -e
```

---

## Directory Structure

```
scripts/
├── README.md                      # This file
├── setup-pi.sh                    # Initial setup automation
├── backup-data.sh                 # Data backup utility
├── monitor-pi.sh                  # System monitor
├── setup-cron.sh                  # Automated task scheduler
└── adis-ot-connect.service        # Systemd service file
```

## Common Tasks

### Daily Workflow

```bash
# Check status
./scripts/monitor-pi.sh

# View recent logs
sudo journalctl -u adis-ot-connect -f

# Manual backup (if not automated)
./scripts/backup-data.sh

# Access application
# Open browser: http://localhost:3000 or http://<pi-ip>:3000
```

### Service Management

```bash
# Check service status
sudo systemctl status adis-ot-connect

# Start service
sudo systemctl start adis-ot-connect

# Stop service
sudo systemctl stop adis-ot-connect

# Restart service
sudo systemctl restart adis-ot-connect

# View logs
sudo journalctl -u adis-ot-connect -f

# View logs from last hour
sudo journalctl -u adis-ot-connect --since "1 hour ago"

# Disable auto-start on boot
sudo systemctl disable adis-ot-connect

# Enable auto-start on boot
sudo systemctl enable adis-ot-connect
```

### Data Management

```bash
# View database
cat /home/pi/adis-ot-data/.data/local-db.json | jq .

# List backups
ls -lh /home/pi/adis-ot-backups/

# Restore specific backup
cd /tmp
tar -xzf /home/pi/adis-ot-backups/adis-ot-backup_TIMESTAMP.tar.gz
cp local-db.json /home/pi/adis-ot-data/.data/

# Check database size
du -h /home/pi/adis-ot-data/.data/local-db.json

# Verify JSON validity
jq empty /home/pi/adis-ot-data/.data/local-db.json
```

### Performance Tuning

```bash
# Monitor real-time resource usage
watch -n 1 top -bn1 | head -20

# Monitor network connections
watch -n 1 "sudo ss -tuln | grep 3000"

# Check disk I/O
iostat -x 1 5

# View application resource usage
ps aux | grep node
```

## Troubleshooting Scripts

### Script won't execute

```bash
# Make sure script is executable
ls -la scripts/
chmod +x scripts/*.sh

# Run with explicit shell
bash scripts/setup-pi.sh
```

### Insufficient permissions

```bash
# Scripts use sudo for system operations
# Make sure your user can use sudo without password for specific commands
# Or run scripts with sudo prefix:
sudo ./scripts/setup-cron.sh
```

### Data backup fails

```bash
# Check data directory exists
ls -la /home/pi/adis-ot-data/.data/

# Check backup directory permissions
ls -la /home/pi/adis-ot-backups/

# Create backup directory if missing
mkdir -p /home/pi/adis-ot-backups
chmod 755 /home/pi/adis-ot-backups
```

## Additional Resources

- **Setup Guide**: See `RASPBERRY_PI_SETUP.md`
- **Troubleshooting**: See `TROUBLESHOOTING.md`
- **Main README**: See `README.md`

## Support

For issues with scripts or the application:
1. Check `TROUBLESHOOTING.md`
2. Review logs: `sudo journalctl -u adis-ot-connect -f`
3. Run monitor script: `./scripts/monitor-pi.sh`
4. Create GitHub issue with system info and logs
