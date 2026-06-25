# ADIS OT Connect Dashboard - Raspberry Pi Quick Reference

## 🚀 Quick Start (Copy & Paste)

```bash
cd ~/adis-ot-connect-dashboard
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

## 📍 URLs & Access

```
http://localhost:3000           # On Raspberry Pi
http://<PI-IP>:3000            # From other devices
```

**Default Credentials:**
- User: `admin`
- Email: `admin@adis.ae`
- Pass: `admin`

## 🔧 Essential Commands

| Task | Command |
|------|---------|
| **Service Status** | `sudo systemctl status adis-ot-connect` |
| **Start Service** | `sudo systemctl start adis-ot-connect` |
| **Stop Service** | `sudo systemctl stop adis-ot-connect` |
| **Restart Service** | `sudo systemctl restart adis-ot-connect` |
| **View Logs** | `sudo journalctl -u adis-ot-connect -f` |
| **Monitor System** | `./scripts/monitor-pi.sh` |
| **Backup Data** | `./scripts/backup-data.sh` |
| **Get Pi IP** | `hostname -I` |

## 📁 Important Paths

| Item | Path |
|------|------|
| Application | `/home/pi/adis-ot-connect-dashboard` |
| Database | `/home/pi/adis-ot-data/.data/local-db.json` |
| Backups | `/home/pi/adis-ot-backups/` |
| Config | `/home/pi/adis-ot-connect-dashboard/.env.local` |
| Service | `/etc/systemd/system/adis-ot-connect.service` |

## 🛠️ Maintenance

```bash
# Check system health
./scripts/monitor-pi.sh

# Create backup
./scripts/backup-data.sh

# View recent logs
sudo journalctl -u adis-ot-connect -n 20

# Check disk space
df -h /home/pi

# Check resources
top
```

## 🔴 Troubleshooting

### Can't access application?
```bash
sudo systemctl restart adis-ot-connect
sudo ss -tuln | grep 3000
sudo ufw allow 3000
```

### Out of memory?
```bash
free -h
top
```

### Data missing?
```bash
ls -la /home/pi/adis-ot-backups/
# Restore from backup
cd /tmp && tar -xzf /home/pi/adis-ot-backups/BACKUP_FILE.tar.gz
cp local-db.json /home/pi/adis-ot-data/.data/
```

### Need to reboot?
```bash
sudo reboot
# Wait 2-3 minutes for service to start
curl http://localhost:3000
```

## 📚 Documentation

- **Full Setup**: `RASPBERRY_PI_SETUP.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Setup Checklist**: `PI_SETUP_CHECKLIST.md`
- **Deployment Summary**: `PI_DEPLOYMENT_SUMMARY.md`
- **Scripts Guide**: `scripts/README.md`

## 🔐 Security Checklist

- [ ] Changed default admin password
- [ ] Firewall enabled: `sudo ufw enable`
- [ ] SSH keys configured (optional)
- [ ] Regular backups running: `crontab -l`
- [ ] OS updated: `sudo apt update && sudo apt upgrade`

## 📊 Performance Check

```bash
# System info
uname -a
free -h
df -h
vcgencmd measure_temp

# Application status
./scripts/monitor-pi.sh

# Database stats
du -h /home/pi/adis-ot-data/.data/local-db.json
jq '.dismissals | length' /home/pi/adis-ot-data/.data/local-db.json
```

## ⚡ Service Lifecycle

```bash
# Enable auto-start on boot
sudo systemctl enable adis-ot-connect

# Disable auto-start
sudo systemctl disable adis-ot-connect

# Check if enabled
sudo systemctl is-enabled adis-ot-connect

# View service file
sudo cat /etc/systemd/system/adis-ot-connect.service
```

## 🔄 Update Application

```bash
cd /home/pi/adis-ot-connect-dashboard
git pull origin main
pnpm install
pnpm build
sudo systemctl restart adis-ot-connect
```

## 📱 Mobile Access

From phone/tablet on same network:
```
http://<RASPBERRY_PI_IP>:3000
```

Example: `http://192.168.1.100:3000`

## 🆘 Emergency Commands

```bash
# Stop everything (emergency)
sudo systemctl stop adis-ot-connect

# Force kill Node process
sudo killall -9 node

# Reset permissions
sudo chown -R pi:pi /home/pi/adis-ot-data

# Check what's using port 3000
sudo lsof -i :3000

# Force restart Pi
sudo reboot

# Halt system safely
sudo shutdown -h now
```

## 💾 Backup Quick Steps

```bash
# Manual backup
./scripts/backup-data.sh

# List backups
ls -lh /home/pi/adis-ot-backups/

# Set up automated backups
./scripts/setup-cron.sh

# Verify automated backups are working
tail -f /home/pi/adis-ot-backups/cron.log
```

## 🔍 Debug Logs

```bash
# Last 50 lines
sudo journalctl -u adis-ot-connect -n 50

# Since specific time
sudo journalctl -u adis-ot-connect --since "2 hours ago"

# Real-time
sudo journalctl -u adis-ot-connect -f

# Save to file
sudo journalctl -u adis-ot-connect > app_logs.txt
```

## 📞 When to Check Logs

- Application won't start
- Can't access from network
- Data seems missing
- Performance issues
- Service keeps crashing

## 🎯 Common Tasks

### Change Admin Password
1. Access `http://localhost:3000`
2. Login with `admin/admin`
3. Go to Admin Settings
4. Change password

### Add Staff Member
1. Go to Staff Directory
2. Click "Add Staff"
3. Fill in details
4. Save

### View Dismissal Records
1. Go to Student Registry
2. View current dismissals
3. Filter by date/class as needed

### Check Backup Status
```bash
./scripts/monitor-pi.sh
# Or manually:
ls -lh /home/pi/adis-ot-backups/ | head -10
```

## 🌐 Network Info

```bash
# Your Pi's IP address
hostname -I

# Full network info
ifconfig eth0  # if wired
ifconfig wlan0 # if wireless

# Check internet connectivity
ping 8.8.8.8
ping google.com
```

## ⏱️ Time Zone Configuration

```bash
# Set timezone
sudo timedatectl set-timezone Asia/Dubai

# Verify
timedatectl
```

## 📦 Disk Usage

```bash
# Application size
du -sh /home/pi/adis-ot-connect-dashboard

# Data size
du -sh /home/pi/adis-ot-data

# Backups size
du -sh /home/pi/adis-ot-backups

# Total home usage
du -sh /home/pi

# Free space
df -h /home/pi
```

## 🚪 First Access

1. Get Pi IP: `hostname -I`
2. Access: `http://<PI-IP>:3000`
3. Login: `admin` / `admin`
4. Change password immediately
5. Navigate dashboard

## ✅ Post-Installation

- [ ] Access application successfully
- [ ] Changed admin password
- [ ] Created test data
- [ ] Ran backup script successfully
- [ ] Verified from another device
- [ ] Set up cron backups
- [ ] Tested service restart

## 📋 Resource Limits (Normal)

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| CPU | <30% | 50-70% | >80% |
| Memory | <50% | 70-85% | >90% |
| Disk | <50% | 70-85% | >90% |
| Temp | <50°C | 60-70°C | >75°C |

---

**Print this page for quick reference!** 📄

For detailed info: See documentation files listed above.
