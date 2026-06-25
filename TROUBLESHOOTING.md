# ADIS OT Connect Dashboard - Troubleshooting Guide

This guide covers common issues and solutions for running the application on Raspberry Pi.

## Table of Contents
1. [Installation Issues](#installation-issues)
2. [Running Issues](#running-issues)
3. [Data Issues](#data-issues)
4. [Performance Issues](#performance-issues)
5. [Network Issues](#network-issues)
6. [Security Issues](#security-issues)

---

## Installation Issues

### Issue: Node.js installation fails

**Problem**: NVM installation or Node.js compilation fails on Raspberry Pi

**Solution:**
```bash
# Method 1: Use pre-built binaries
cd ~
wget https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-armv7l.tar.xz
tar -xf node-v20.10.0-linux-armv7l.tar.xz
sudo cp -r node-v20.10.0-linux-armv7l/* /usr/local/
node -v

# Method 2: Use NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Issue: PNPM or npm install is very slow

**Problem**: Package installation takes 30+ minutes

**Solution:**
```bash
# Increase timeout and retry attempts
pnpm install --timeout=600000 --retry=3

# Or use npm with increased timeout
npm install --loglevel=verbose --registry https://registry.npmjs.org/

# Alternative: Enable offline mode if packages are cached
pnpm install --frozen-lockfile
```

### Issue: Build fails with "Out of Memory"

**Problem**: `pnpm build` fails with memory error

**Solution:**
```bash
# Increase swap space
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Verify swap
free -h

# Try build again
NODE_OPTIONS=--max-old-space-size=1024 pnpm build
```

---

## Running Issues

### Issue: Application won't start

**Problem**: `pnpm start` shows errors

**Solutions:**

```bash
# Check if port 3000 is in use
sudo lsof -i :3000
# or
sudo ss -tuln | grep 3000

# Free the port
sudo kill -9 <PID>

# Try running on different port
PORT=8080 pnpm start

# Check for permission issues
ls -la /home/pi/adis-ot-data/
# Fix if needed:
sudo chown -R pi:pi /home/pi/adis-ot-data
```

### Issue: Service fails to start (systemd)

**Problem**: `systemctl status adis-ot-connect` shows failed

**Solutions:**
```bash
# Check service logs
sudo journalctl -u adis-ot-connect -n 50 -e

# Verify service file is correct
sudo cat /etc/systemd/system/adis-ot-connect.service

# Manually test the command from service file
/home/pi/.nvm/versions/node/v20.10.0/bin/pnpm start

# If command doesn't work, find correct node path:
which node
which pnpm

# Update service file with correct paths:
sudo nano /etc/systemd/system/adis-ot-connect.service

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart adis-ot-connect
```

### Issue: "Cannot find module" errors

**Problem**: Dependencies not found after installation

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear cache
pnpm store prune

# Verify installation
pnpm list | head -20
```

---

## Data Issues

### Issue: Data directory permission errors

**Problem**: "Permission denied" when accessing `.data/local-db.json`

**Solutions:**
```bash
# Fix ownership
sudo chown -R pi:pi /home/pi/adis-ot-data

# Fix permissions
chmod 755 /home/pi/adis-ot-data
chmod 644 /home/pi/adis-ot-data/.data/local-db.json

# Verify
ls -la /home/pi/adis-ot-data/.data/
```

### Issue: Database file corrupted

**Problem**: JSON parse errors or data loss

**Solutions:**
```bash
# Backup current (corrupted) file
cp /home/pi/adis-ot-data/.data/local-db.json \
   /home/pi/adis-ot-data/.data/local-db.json.backup

# Validate JSON structure
jq empty /home/pi/adis-ot-data/.data/local-db.json

# If validation fails, restore from backup
ls -la /home/pi/adis-ot-backups/
# Extract a backup
cd /tmp
tar -xzf /home/pi/adis-ot-backups/adis-ot-backup_20240101_020000.tar.gz
# Restore the file
cp local-db.json /home/pi/adis-ot-data/.data/local-db.json
```

### Issue: Data not persisting between restarts

**Problem**: Data is lost when application stops

**Solutions:**
```bash
# Verify data directory is correct in .env.local
grep LOCAL_DB_DIR ~/.env.local

# Ensure data directory has write permissions
touch /home/pi/adis-ot-data/.data/test.txt && rm $_

# Check disk space
df -h /home/pi

# If disk is full, delete old backups
ls -lh /home/pi/adis-ot-backups/
rm /home/pi/adis-ot-backups/adis-ot-backup_OLD_*.tar.gz
```

---

## Performance Issues

### Issue: Application is very slow

**Problem**: Pages load slowly, operations take long time

**Solutions:**
```bash
# Monitor system resources
top
# Look for high CPU or memory usage

# Check disk I/O
iostat -x 1 5

# Reduce concurrent operations
# Add to .env.local:
echo "MAX_WORKERS=1" >> .env.local

# Restart application
sudo systemctl restart adis-ot-connect

# Monitor database file size (if too large, performance degrades)
du -h /home/pi/adis-ot-data/.data/local-db.json
```

### Issue: High memory usage

**Problem**: Application uses 300MB+ memory

**Solutions:**
```bash
# Monitor process memory
ps aux | grep node

# Set memory limit in systemd service:
sudo nano /etc/systemd/system/adis-ot-connect.service
# Add: MemoryLimit=512M

# Or set Node.js heap limit
export NODE_OPTIONS="--max-old-space-size=512"
pnpm start

# Restart service
sudo systemctl daemon-reload
sudo systemctl restart adis-ot-connect
```

### Issue: Disk space issues

**Problem**: `/home/pi` partition is full

**Solutions:**
```bash
# Check disk usage
df -h

# Find large files
du -sh /home/pi/* | sort -h

# Clean up common issues
rm -rf ~/.npm  # npm cache
rm -rf ~/.pnpm-store  # pnpm cache
pnpm store prune

# Delete old backups
find /home/pi/adis-ot-backups -name "*.tar.gz" -mtime +30 -delete

# Check application logs
sudo journalctl --vacuum-time=7d
```

---

## Network Issues

### Issue: Cannot access from other devices on network

**Problem**: `http://<pi-ip>:3000` doesn't work from other devices

**Solutions:**
```bash
# Verify application is listening on all interfaces
sudo ss -tuln | grep 3000
# Should show: 0.0.0.0:3000

# Check firewall
sudo ufw status
# Enable port if needed:
sudo ufw allow 3000

# Verify Pi's IP address
hostname -I

# Test from Pi itself
curl http://localhost:3000
curl http://<pi-ip>:3000

# Check if issue is network-level
# Ping from another device:
ping <pi-ip>

# Restart application to force rebind
sudo systemctl restart adis-ot-connect
```

### Issue: Connection timeout from remote devices

**Problem**: Remote devices see timeout connecting to Pi

**Solutions:**
```bash
# Increase backlog for connections
# Add to systemd service:
ExecStartPre=/sbin/sysctl -w net.core.somaxconn=1024

# Or manually:
sudo sysctl -w net.core.somaxconn=1024

# Check network connectivity
ip addr show
netstat -an | grep LISTEN

# If behind router, check router port forwarding
# See RASPBERRY_PI_SETUP.md section "Enable Port Forwarding"
```

---

## Security Issues

### Issue: Default admin credentials still active

**Problem**: Forgot to change password after installation

**Solutions:**
```bash
# Connect to application
# Login with: admin / admin
# Change password in admin panel

# Or directly in database (caution):
jq '.admin[0].passwordHash = "<new-hash>"' \
   /home/pi/adis-ot-data/.data/local-db.json > /tmp/db.json
mv /tmp/db.json /home/pi/adis-ot-data/.data/local-db.json

# Generate password hash:
node -e "
const bcrypt = require('bcryptjs');
const password = 'YourNewPassword';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log(hash);
"
```

### Issue: Unauthorized access concerns

**Problem**: Suspicious access patterns in logs

**Solutions:**
```bash
# Review recent logs
sudo journalctl -u adis-ot-connect --since "1 hour ago" -e

# Check for failed login attempts
grep -i "login\|auth" /home/pi/adis-ot-data/.data/local-db.json

# Audit file permissions
ls -la /home/pi/adis-ot-data/.data/

# If suspected breach, create new admin account
# Stop application
sudo systemctl stop adis-ot-connect

# Modify database to reset passwords
# Then restart
sudo systemctl start adis-ot-connect
```

---

## Getting Help

If issues persist:

1. **Check logs first**
   ```bash
   sudo journalctl -u adis-ot-connect -f
   tail -f /home/pi/adis-ot-backups/cron.log
   ```

2. **Collect system info**
   ```bash
   uname -a
   node -v
   pnpm -v
   free -h
   df -h
   ```

3. **Test basic connectivity**
   ```bash
   curl http://localhost:3000
   curl http://<pi-ip>:3000
   ```

4. **Check GitHub Issues**
   - https://github.com/akulsaju1/adis-ot-connect-dashboard/issues

5. **Create detailed issue report**
   - Include system info from above
   - Provide relevant error logs
   - List steps to reproduce problem
