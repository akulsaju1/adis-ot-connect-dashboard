#!/bin/bash

# ADIS OT Connect Dashboard - Raspberry Pi Quick Setup Script
# This script automates the setup process on a Raspberry Pi

set -e

echo "================================================"
echo "ADIS OT Connect Dashboard - Raspberry Pi Setup"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as pi user
if [[ $USER != "pi" ]]; then
    echo -e "${RED}Error: This script must be run as the 'pi' user${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Step 2: Install build tools
echo -e "${YELLOW}Step 2: Installing build tools...${NC}"
sudo apt install -y build-essential python3 git curl
echo -e "${GREEN}✓ Build tools installed${NC}"
echo ""

# Step 3: Check and install Node.js if not present
echo -e "${YELLOW}Step 3: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js v20 LTS via NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    nvm install 20
    nvm use 20
    echo -e "${GREEN}✓ Node.js v20 installed${NC}"
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js already installed: $NODE_VERSION${NC}"
fi
echo ""

# Step 4: Check and install PNPM
echo -e "${YELLOW}Step 4: Checking PNPM installation...${NC}"
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm@9
    echo -e "${GREEN}✓ PNPM installed${NC}"
else
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓ PNPM already installed: $PNPM_VERSION${NC}"
fi
echo ""

# Step 5: Create data directory
echo -e "${YELLOW}Step 5: Creating data directory...${NC}"
mkdir -p /home/pi/adis-ot-data/.data
chmod 755 /home/pi/adis-ot-data
echo -e "${GREEN}✓ Data directory created at /home/pi/adis-ot-data/.data${NC}"
echo ""

# Step 6: Install project dependencies
echo -e "${YELLOW}Step 6: Installing project dependencies...${NC}"
echo "This may take several minutes on Raspberry Pi..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 7: Create .env.local if it doesn't exist
echo -e "${YELLOW}Step 7: Configuring environment...${NC}"
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    
    # Generate BETTER_AUTH_SECRET
    AUTH_SECRET=$(openssl rand -base64 32)
    
    cat > .env.local << EOF
NODE_ENV=production
DATABASE_URL=local
BETTER_AUTH_SECRET=$AUTH_SECRET
NEXT_PUBLIC_BASE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
LOCAL_DB_DIR=/home/pi/adis-ot-data/.data
EOF
    
    echo -e "${GREEN}✓ .env.local created with secure configuration${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi
echo ""

# Step 8: Build the application
echo -e "${YELLOW}Step 8: Building application...${NC}"
echo "This may take 5-10 minutes on Raspberry Pi. Please be patient..."
pnpm build
echo -e "${GREEN}✓ Application built successfully${NC}"
echo ""

# Step 9: Install as systemd service (optional)
echo -e "${YELLOW}Step 9: Service Setup${NC}"
echo "Do you want to install as a systemd service for auto-start? (y/n)"
read -r INSTALL_SERVICE

if [[ $INSTALL_SERVICE == "y" || $INSTALL_SERVICE == "Y" ]]; then
    echo "Installing systemd service..."
    
    # Copy service file
    sudo cp scripts/adis-ot-connect.service /etc/systemd/system/
    
    # Update the node path in service file if needed
    ACTUAL_NODE_PATH=$(which node | xargs -I {} dirname {} | xargs -I {} dirname {})
    echo "Detected Node.js path: $ACTUAL_NODE_PATH"
    
    sudo systemctl daemon-reload
    sudo systemctl enable adis-ot-connect
    sudo systemctl start adis-ot-connect
    
    # Wait a moment for service to start
    sleep 2
    
    if sudo systemctl is-active --quiet adis-ot-connect; then
        echo -e "${GREEN}✓ Service installed and started successfully${NC}"
    else
        echo -e "${RED}✗ Service failed to start. Check logs with: sudo journalctl -u adis-ot-connect -f${NC}"
    fi
else
    echo "Skipping service installation."
    echo "You can start the app manually with: pnpm start"
fi
echo ""

# Step 10: Display summary
echo "================================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Application Information:"
echo "  - URL: http://localhost:3000"
echo "  - Data: /home/pi/adis-ot-data/.data/local-db.json"
echo ""
echo "Default Credentials:"
echo "  - Username: admin"
echo "  - Email: admin@adis.ae"
echo "  - Password: admin"
echo ""
echo "Next Steps:"

if [[ $INSTALL_SERVICE == "y" || $INSTALL_SERVICE == "Y" ]]; then
    echo "  1. Check service status: sudo systemctl status adis-ot-connect"
    echo "  2. View logs: sudo journalctl -u adis-ot-connect -f"
    echo "  3. Access the app: http://localhost:3000 (or http://<pi-ip>:3000 from another device)"
else
    echo "  1. Start the application: pnpm start"
    echo "  2. Access the app: http://localhost:3000"
fi

echo ""
echo "For more information, see RASPBERRY_PI_SETUP.md"
echo ""
