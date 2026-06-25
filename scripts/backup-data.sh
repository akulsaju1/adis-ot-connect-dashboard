#!/bin/bash

# ADIS OT Connect Dashboard - Data Backup Script
# Backs up all local data with timestamped archive

set -e

# Configuration
DATA_DIR="/home/pi/adis-ot-data/.data"
BACKUP_DIR="/home/pi/adis-ot-backups"
RETENTION_DAYS=30

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "ADIS OT Connect Dashboard - Data Backup"
echo "================================================"
echo ""

# Check if data exists
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${RED}Error: Data directory not found: $DATA_DIR${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/adis-ot-backup_$TIMESTAMP.tar.gz"

echo -e "${YELLOW}Starting backup...${NC}"
echo "Source: $DATA_DIR"
echo "Destination: $BACKUP_FILE"
echo ""

# Create compressed backup
if tar -czf "$BACKUP_FILE" -C "$DATA_DIR" . 2>/dev/null; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    echo "  File size: $SIZE"
    echo ""
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# List backups
echo "Recent backups:"
ls -lh "$BACKUP_DIR" | tail -5
echo ""

# Clean up old backups (older than retention period)
echo -e "${YELLOW}Cleaning up old backups (keeping last $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "adis-ot-backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

OLD_BACKUPS=$(find "$BACKUP_DIR" -name "adis-ot-backup_*.tar.gz" | wc -l)
echo -e "${GREEN}✓ Cleanup complete - $OLD_BACKUPS backup(s) retained${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}Backup process completed${NC}"
echo "================================================"
