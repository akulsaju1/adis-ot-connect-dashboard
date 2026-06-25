#!/bin/bash

# ADIS OT Connect Dashboard - Cron Job Setup
# Sets up automated backups and maintenance tasks

set -e

echo "================================================"
echo "ADIS OT Connect Dashboard - Cron Setup"
echo "================================================"
echo ""

APP_DIR="/home/pi/adis-ot-connect-dashboard"
BACKUP_SCRIPT="$APP_DIR/scripts/backup-data.sh"

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

echo "This script will set up automated tasks:"
echo "  1. Daily backup at 2:00 AM"
echo "  2. Weekly health check every Monday at 6:00 AM"
echo ""

# Get current crontab (if it exists)
TEMP_CRON=$(mktemp)
crontab -l > "$TEMP_CRON" 2>/dev/null || true

# Check if cron entries already exist
if grep -q "adis-ot.*backup" "$TEMP_CRON"; then
    echo "Cron entries already exist for this application."
    echo "Current cron jobs:"
    grep "adis-ot" "$TEMP_CRON" || true
    echo ""
    echo "Remove existing entries? (y/n)"
    read -r REMOVE_EXISTING
    if [[ $REMOVE_EXISTING == "y" || $REMOVE_EXISTING == "Y" ]]; then
        grep -v "adis-ot" "$TEMP_CRON" > "$TEMP_CRON.new" || true
        mv "$TEMP_CRON.new" "$TEMP_CRON"
    fi
fi

# Add new cron entries
echo ""
echo "Adding cron jobs..."

# Daily backup at 2:00 AM
echo "0 2 * * * $BACKUP_SCRIPT >> /home/pi/adis-ot-backups/cron.log 2>&1" >> "$TEMP_CRON"

# Weekly health check/restart on Monday at 6:00 AM
echo "0 6 * * 1 sudo systemctl restart adis-ot-connect >> /home/pi/adis-ot-backups/cron.log 2>&1" >> "$TEMP_CRON"

# Install new crontab
crontab "$TEMP_CRON"
rm "$TEMP_CRON"

echo "✓ Cron jobs configured successfully"
echo ""
echo "Scheduled tasks:"
echo "  • Daily backup: 2:00 AM"
echo "  • Weekly restart: Monday 6:00 AM"
echo ""
echo "View cron logs: tail -f /home/pi/adis-ot-backups/cron.log"
echo "Edit cron: crontab -e"
echo "List cron: crontab -l"
echo ""
