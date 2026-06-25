# ADIS OT Connect Dashboard - Raspberry Pi Documentation Index

## 🎯 Start Here

**New to Raspberry Pi hosting?** Start with: **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⭐

**First time setup?** Follow: **[RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)**

**Got an error?** Check: **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

---

## 📚 Complete Documentation Map

### 📖 Getting Started (Read First)

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** ⭐ | 1-page cheat sheet for all commands | 5 min |
| **[PI_DEPLOYMENT_SUMMARY.md](PI_DEPLOYMENT_SUMMARY.md)** | Overview of what was set up for you | 10 min |
| **[PI_SETUP_CHECKLIST.md](PI_SETUP_CHECKLIST.md)** | Step-by-step setup verification | 20 min |

### 📋 Installation & Setup

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)** | Complete 250+ line setup guide | 30 min |
| **[.env.pi.example](.env.pi.example)** | Environment configuration template | 5 min |
| **[scripts/README.md](scripts/README.md)** | Helper scripts documentation | 15 min |

### 🔧 Scripts & Tools

| Script | Purpose | Usage |
|--------|---------|-------|
| **[scripts/setup-pi.sh](scripts/setup-pi.sh)** | One-command automated setup | `./scripts/setup-pi.sh` |
| **[scripts/backup-data.sh](scripts/backup-data.sh)** | Data backup utility | `./scripts/backup-data.sh` |
| **[scripts/monitor-pi.sh](scripts/monitor-pi.sh)** | System monitoring | `./scripts/monitor-pi.sh` |
| **[scripts/setup-cron.sh](scripts/setup-cron.sh)** | Automated backups | `./scripts/setup-cron.sh` |
| **[scripts/adis-ot-connect.service](scripts/adis-ot-connect.service)** | Systemd service file | (Auto-installed) |

### 🐛 Troubleshooting & Support

| Document | Covers | Read Time |
|----------|--------|-----------|
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | 50+ common issues & solutions | 30 min |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | Emergency commands & quick fixes | 5 min |
| **[PI_SETUP_CHECKLIST.md](PI_SETUP_CHECKLIST.md)** | Verification & troubleshooting steps | 20 min |

### ⚙️ Configuration

| File | Purpose |
|------|---------|
| **[next.config.js](next.config.js)** | Next.js optimizations for Raspberry Pi |
| **[.env.pi.example](.env.pi.example)** | Environment variables template |
| **[scripts/adis-ot-connect.service](scripts/adis-ot-connect.service)** | Systemd service configuration |

---

## 🚀 Quick Navigation by Task

### "I want to install this on my Raspberry Pi"
1. Read: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) (5 min overview)
2. Read: [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md) (full setup guide)
3. Run: `./scripts/setup-pi.sh` (automated setup)
4. Use: [PI_SETUP_CHECKLIST.md](PI_SETUP_CHECKLIST.md) (verify all steps)

### "It's not working - I need help"
1. Check: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Essential commands section
2. Find issue in: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Monitor status: `./scripts/monitor-pi.sh`
4. View logs: `sudo journalctl -u adis-ot-connect -f`

### "I want to backup my data"
1. Quick backup: `./scripts/backup-data.sh`
2. Set up automated: `./scripts/setup-cron.sh`
3. Verify backups: `ls -lh /home/pi/adis-ot-backups/`

### "I want to monitor system health"
1. Real-time monitor: `./scripts/monitor-pi.sh`
2. Auto-refresh: `watch -n 5 ./scripts/monitor-pi.sh`
3. Check logs: `sudo journalctl -u adis-ot-connect -f`

### "I want to update the application"
1. See: [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md) - "Updates and Maintenance" section
2. Run: 
   ```bash
   cd /home/pi/adis-ot-connect-dashboard
   git pull origin main
   pnpm install && pnpm build
   sudo systemctl restart adis-ot-connect
   ```

### "I forgot how to do something"
→ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 📊 Documentation Statistics

| Type | Count | Total Pages |
|------|-------|-------------|
| Setup Guides | 3 | ~40 |
| Troubleshooting | 2 | ~30 |
| Scripts | 4 | N/A |
| Quick Reference | 1 | ~10 |
| Checklists | 1 | ~15 |
| **Total** | **11** | **~100** |

---

## 🎯 Knowledge Levels

### Beginner
- Start: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Then: [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)
- Use: [PI_SETUP_CHECKLIST.md](PI_SETUP_CHECKLIST.md)

### Intermediate
- Setup already done
- Use: [scripts/README.md](scripts/README.md)
- Reference: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- When stuck: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Advanced
- Want to customize
- Edit: [next.config.js](next.config.js)
- Modify: [.env.pi.example](.env.pi.example)
- Understand: [scripts/adis-ot-connect.service](scripts/adis-ot-connect.service)
- Deep dive: [scripts/README.md](scripts/README.md)

---

## ⏱️ Time Investment

| Task | Time | Difficulty |
|------|------|-----------|
| Hardware setup | 20-30 min | Easy |
| OS installation | 15-20 min | Easy |
| App installation | 30-45 min | Very Easy |
| Initial configuration | 15-20 min | Very Easy |
| **Total First Setup** | **1.5-2.5 hours** | **Easy** |
| First-week testing | 1-2 hours | Medium |
| Monthly maintenance | 20-30 min | Easy |

---

## 💾 File Locations Quick Lookup

```
Project Directory:
  /home/pi/adis-ot-connect-dashboard/

Data Storage:
  /home/pi/adis-ot-data/.data/local-db.json

Backups:
  /home/pi/adis-ot-backups/

Systemd Service:
  /etc/systemd/system/adis-ot-connect.service

Configuration:
  /home/pi/adis-ot-connect-dashboard/.env.local

Documentation:
  /home/pi/adis-ot-connect-dashboard/*.md
```

---

## 🔐 Security Checklist Quick Links

- [ ] Changed default password → [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Security Checklist
- [ ] Enabled firewall → [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Network Issues
- [ ] Set up backups → `./scripts/setup-cron.sh`
- [ ] Updated OS → [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md) - Updates section

---

## 📞 Support Resources

| Resource | Purpose | Link |
|----------|---------|------|
| **Main README** | Project overview | [README.md](README.md) |
| **Setup Guide** | Step-by-step installation | [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md) |
| **Troubleshooting** | Problem solutions | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| **Quick Reference** | Commands cheat sheet | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) |
| **Scripts Guide** | Automation tools | [scripts/README.md](scripts/README.md) |
| **GitHub Issues** | Report bugs | https://github.com/akulsaju1/adis-ot-connect-dashboard/issues |
| **GitHub Discussions** | Ask questions | https://github.com/akulsaju1/adis-ot-connect-dashboard/discussions |

---

## 🎓 Learning Path Recommended

### Week 1: Installation
1. **Monday**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md) + [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)
2. **Tuesday-Wednesday**: Run `./scripts/setup-pi.sh`
3. **Thursday**: Use [PI_SETUP_CHECKLIST.md](PI_SETUP_CHECKLIST.md)
4. **Friday**: Test and verify using [scripts/README.md](scripts/README.md)

### Week 2-4: Operations
1. Daily: `./scripts/monitor-pi.sh`
2. Check: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if issues
3. Daily use of [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands
4. Set up: `./scripts/setup-cron.sh` for automation

### Ongoing: Maintenance
1. Weekly: Review [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md) maintenance section
2. Monthly: Check [PI_DEPLOYMENT_SUMMARY.md](PI_DEPLOYMENT_SUMMARY.md) maintenance schedule
3. As needed: Reference [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 🎯 What You Get

✅ Complete local hosting on Raspberry Pi  
✅ All data stored locally (no cloud required)  
✅ Automated backups with 30-day retention  
✅ System monitoring tools  
✅ Comprehensive troubleshooting guides  
✅ 100+ pages of documentation  
✅ Zero monthly hosting costs  
✅ Full control over your data  

---

## 📝 Document Versions

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md) | 1.0 | June 2024 | ✅ Current |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | 1.0 | June 2024 | ✅ Current |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 1.0 | June 2024 | ✅ Current |
| [PI_DEPLOYMENT_SUMMARY.md](PI_DEPLOYMENT_SUMMARY.md) | 1.0 | June 2024 | ✅ Current |
| [PI_SETUP_CHECKLIST.md](PI_SETUP_CHECKLIST.md) | 1.0 | June 2024 | ✅ Current |
| [scripts/README.md](scripts/README.md) | 1.0 | June 2024 | ✅ Current |

---

## 🚀 Next Steps

1. **Choose your path**:
   - Brand new? → Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
   - Ready to install? → Read [RASPBERRY_PI_SETUP.md](RASPBERRY_PI_SETUP.md)
   - Have issues? → Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

2. **Get your Raspberry Pi** (if you don't have one)
   - Pi 4B 4GB minimum recommended
   - 32GB+ MicroSD card
   - Power supply (5V 3A)

3. **Follow setup**
   - Flash Raspberry Pi OS
   - Run `./scripts/setup-pi.sh`
   - Change default password
   - Set up backups with `./scripts/setup-cron.sh`

4. **Start using it**
   - Access on network: `http://<PI-IP>:3000`
   - Add staff and NFC tags
   - Run dismissal sessions
   - Monitor with `./scripts/monitor-pi.sh`

---

**Welcome to local, cost-free hosting!** 🎉

For questions, see the documentation above or create an issue on GitHub.
