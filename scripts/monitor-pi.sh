#!/bin/bash

# ADIS OT Connect Dashboard - Raspberry Pi System Monitor
# Displays real-time system and application status

clear

echo "================================================"
echo "ADIS OT Connect Dashboard - System Monitor"
echo "$(date)"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check service status
check_service() {
    if sudo systemctl is-active --quiet adis-ot-connect; then
        echo -e "${GREEN}● Running${NC}"
        return 0
    else
        echo -e "${RED}● Stopped${NC}"
        return 1
    fi
}

# Function to format bytes to human readable
format_bytes() {
    echo "$1" | awk '{
        if ($1 > 1073741824) printf "%.2f GB", $1/1073741824
        else if ($1 > 1048576) printf "%.2f MB", $1/1048576
        else if ($1 > 1024) printf "%.2f KB", $1/1024
        else printf "%.2f B", $1
    }'
}

# Section 1: Service Status
echo -e "${BLUE}Service Status:${NC}"
echo -n "  Application: "
check_service
SERVICE_RUNNING=$?
echo ""

# Section 2: System Resources
echo -e "${BLUE}System Resources:${NC}"

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
echo "  CPU Usage: $CPU_USAGE%"

# Memory
MEMORY=$(free -b | grep Mem)
TOTAL_MEM=$(echo $MEMORY | awk '{print $2}')
USED_MEM=$(echo $MEMORY | awk '{print $3}')
FREE_MEM=$(echo $MEMORY | awk '{print $4}')
MEM_PERCENT=$((100 * $USED_MEM / $TOTAL_MEM))

echo "  Memory: $(format_bytes $USED_MEM) / $(format_bytes $TOTAL_MEM) ($MEM_PERCENT%)"
echo "  Free: $(format_bytes $FREE_MEM)"

# Disk usage
DISK=$(df /home/pi)
DISK_USED=$(echo "$DISK" | tail -1 | awk '{print $3}')
DISK_TOTAL=$(echo "$DISK" | tail -1 | awk '{print $2}')
DISK_PERCENT=$(echo "$DISK" | tail -1 | awk '{print $5}' | sed 's/%//')

echo "  Disk (home): $(format_bytes $DISK_USED) / $(format_bytes $DISK_TOTAL) ($DISK_PERCENT%)"

# Temperature
TEMP=$(vcgencmd measure_temp 2>/dev/null | grep -oP '\d+\.\d+')
if [ -z "$TEMP" ]; then
    TEMP="N/A"
else
    TEMP="${TEMP}°C"
fi
echo "  Temperature: $TEMP"
echo ""

# Section 3: Application Data
echo -e "${BLUE}Application Data:${NC}"

DATA_FILE="/home/pi/adis-ot-data/.data/local-db.json"
if [ -f "$DATA_FILE" ]; then
    DB_SIZE=$(stat -f%z "$DATA_FILE" 2>/dev/null || stat -c%s "$DATA_FILE" 2>/dev/null)
    echo "  Database size: $(format_bytes $DB_SIZE)"
    
    # Count records
    if command -v jq &> /dev/null; then
        ADMIN_COUNT=$(jq '.admin | length' "$DATA_FILE" 2>/dev/null || echo "0")
        NFC_COUNT=$(jq '.nfcTags | length' "$DATA_FILE" 2>/dev/null || echo "0")
        DISMISSAL_COUNT=$(jq '.dismissals | length' "$DATA_FILE" 2>/dev/null || echo "0")
        STAFF_COUNT=$(jq '.staffDirectory | length' "$DATA_FILE" 2>/dev/null || echo "0")
        
        echo "  Records:"
        echo "    - Admins: $ADMIN_COUNT"
        echo "    - NFC Tags: $NFC_COUNT"
        echo "    - Dismissals: $DISMISSAL_COUNT"
        echo "    - Staff: $STAFF_COUNT"
    fi
else
    echo "  Database: Not found (may not have been initialized)"
fi
echo ""

# Section 4: Network
echo -e "${BLUE}Network:${NC}"

IP_ADDRESS=$(hostname -I | awk '{print $1}')
echo "  Local IP: $IP_ADDRESS"
echo "  URL: http://$IP_ADDRESS:3000"
echo ""

# Section 5: Service Logs (recent)
if [ $SERVICE_RUNNING -eq 0 ]; then
    echo -e "${BLUE}Recent Application Logs:${NC}"
    sudo journalctl -u adis-ot-connect -n 5 --no-pager | sed 's/^/  /'
else
    echo -e "${YELLOW}Service not running. Last logs:${NC}"
    sudo journalctl -u adis-ot-connect -n 10 --no-pager | tail -5 | sed 's/^/  /'
fi

echo ""
echo "================================================"
echo "Refresh this monitor: watch -n 5 '$0'"
echo "Check logs: sudo journalctl -u adis-ot-connect -f"
echo "Stop service: sudo systemctl stop adis-ot-connect"
echo "Start service: sudo systemctl start adis-ot-connect"
echo "================================================"
