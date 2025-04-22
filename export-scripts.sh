#!/bin/bash
# Export Scripts for Buzzd App
# This script provides utilities to export your app data for migration between platforms

# Database Export Script
# Usage: ./export-scripts.sh export-db

export_database() {
  echo "Exporting database from Neon PostgreSQL..."
  
  # Check if DATABASE_URL environment variable is set
  if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set."
    echo "Please set it with your database connection string, for example:"
    echo "export DATABASE_URL=postgresql://neondb_owner:password@ep-mute-wave-a5t2c5zr.us-east-2.aws.neon.tech/neondb"
    exit 1
  fi
  
  # Parse DATABASE_URL to get individual components
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\).*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\).*/\1/p')
  DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
  
  echo "Exporting database from:"
  echo "Host: $DB_HOST"
  echo "Database: $DB_NAME"
  echo "User: $DB_USER"
  
  # Export the database to a file
  EXPORT_FILE="buzzd_db_$(date +%Y%m%d_%H%M%S).sql"
  
  echo "Exporting to file: $EXPORT_FILE"
  echo "Please wait, this may take a few minutes..."
  
  PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges > $EXPORT_FILE
  
  if [ $? -eq 0 ]; then
    echo "Export successful! File saved as: $EXPORT_FILE"
  else
    echo "Export failed."
  fi
}

# Create a directory with essential deployment files
export_deployment_package() {
  echo "Creating deployment package..."
  
  # Create a directory for the deployment package
  PACKAGE_DIR="buzzd-deployment-$(date +%Y%m%d_%H%M%S)"
  mkdir -p $PACKAGE_DIR
  
  # Copy essential deployment files
  cp simplified-server.js $PACKAGE_DIR/
  cp package.json $PACKAGE_DIR/
  cp -r server $PACKAGE_DIR/
  cp -r shared $PACKAGE_DIR/
  cp -r dist $PACKAGE_DIR/ 2>/dev/null || echo "No dist directory found. Run 'npm run build' first."
  cp -r .env.example $PACKAGE_DIR/
  cp README.md $PACKAGE_DIR/ 2>/dev/null || echo "No README.md found."
  cp platform-deployment-guide.md $PACKAGE_DIR/
  
  # Create platform-specific files
  echo "web: node simplified-server.js" > $PACKAGE_DIR/Procfile  # For Heroku
  echo '{"run":"node simplified-server.js"}' > $PACKAGE_DIR/.replit.deploy  # For Replit
  
  # Create a Docker file for containerized deployments
  cat > $PACKAGE_DIR/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "simplified-server.js"]
EOF

  # Create a basic docker-compose file
  cat > $PACKAGE_DIR/docker-compose.yml << 'EOF'
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: always
EOF

  # Create a .gitignore file
  cat > $PACKAGE_DIR/.gitignore << 'EOF'
node_modules
.env
*.log
EOF

  # Create a zip archive
  ZIP_FILE="${PACKAGE_DIR}.zip"
  zip -r $ZIP_FILE $PACKAGE_DIR > /dev/null
  
  echo "Deployment package created successfully!"
  echo "Package directory: $PACKAGE_DIR"
  echo "Zip archive: $ZIP_FILE"
  echo ""
  echo "To deploy, copy the files to your hosting platform and follow the instructions in platform-deployment-guide.md"
}

# Parse command line arguments
case "$1" in
  "export-db")
    export_database
    ;;
  "create-package")
    export_deployment_package
    ;;
  *)
    echo "Buzzd App Export Utility"
    echo "Usage:"
    echo "  ./export-scripts.sh export-db         Export database to SQL file"
    echo "  ./export-scripts.sh create-package    Create deployment package"
    ;;
esac