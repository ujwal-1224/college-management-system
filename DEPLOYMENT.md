# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the College Management System to production.

---

## Pre-Deployment Checklist

### 1. Code Preparation ✅
- [x] All features implemented
- [x] All tests passing
- [x] Code reviewed
- [x] Documentation complete
- [x] No console errors
- [x] No security vulnerabilities

### 2. Environment Setup
- [ ] Production server provisioned
- [ ] MySQL database created
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Firewall rules configured
- [ ] Backup system ready

### 3. Configuration Files
- [ ] `.env` file configured for production
- [ ] Database credentials updated
- [ ] Session secret changed
- [ ] Port configuration verified
- [ ] CORS settings configured (if needed)

---

## Deployment Steps

### Step 1: Server Setup

#### 1.1 Install Node.js
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 1.2 Install MySQL
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Verify installation
mysql --version
```

#### 1.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

---

### Step 2: Database Setup

#### 2.1 Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE college_management;

# Create user
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON college_management.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

#### 2.2 Import Schema
```bash
# Import database schema
mysql -u cms_user -p college_management < config/schema.sql
```

#### 2.3 Seed Data (Optional)
```bash
# Configure database connection in .env first
node scripts/seed-data.js
```

---

### Step 3: Application Deployment

#### 3.1 Clone Repository
```bash
# Navigate to deployment directory
cd /var/www

# Clone repository
git clone <your-repository-url> college-management-system
cd college-management-system
```

#### 3.2 Install Dependencies
```bash
npm install --production
```

#### 3.3 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

**Required Environment Variables:**
```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=cms_user
DB_PASSWORD=your_secure_password
DB_NAME=college_management

# Session Configuration
SESSION_SECRET=your_very_long_random_secret_key_here

# Application Configuration
APP_URL=https://yourdomain.com
```

#### 3.4 Test Application
```bash
# Test the application
npm start

# Verify it's running
curl http://localhost:3000
```

---

### Step 4: Process Management

#### 4.1 Start with PM2
```bash
# Start application
pm2 start server.js --name "college-cms"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 4.2 PM2 Commands
```bash
# View logs
pm2 logs college-cms

# Monitor
pm2 monit

# Restart
pm2 restart college-cms

# Stop
pm2 stop college-cms

# Delete
pm2 delete college-cms
```

---

### Step 5: Web Server Configuration

#### 5.1 Install Nginx
```bash
sudo apt-get install nginx
```

#### 5.2 Configure Nginx
```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/college-cms
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 5.3 Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/college-cms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### Step 6: SSL Configuration

#### 6.1 Install Certbot
```bash
sudo apt-get install certbot python3-certbot-nginx
```

#### 6.2 Obtain SSL Certificate
```bash
# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts to complete setup
```

#### 6.3 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot will automatically renew certificates
```

---

### Step 7: Firewall Configuration

#### 7.1 Configure UFW
```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

### Step 8: Backup Configuration

#### 8.1 Database Backup Script
```bash
# Create backup directory
mkdir -p /var/backups/college-cms

# Create backup script
nano /usr/local/bin/backup-cms-db.sh
```

**Backup Script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/college-cms"
DB_NAME="college_management"
DB_USER="cms_user"
DB_PASS="your_secure_password"

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### 8.2 Make Script Executable
```bash
sudo chmod +x /usr/local/bin/backup-cms-db.sh
```

#### 8.3 Schedule Backups
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-cms-db.sh
```

---

### Step 9: Monitoring Setup

#### 9.1 Install Monitoring Tools
```bash
# Install htop for system monitoring
sudo apt-get install htop

# Install netdata for real-time monitoring (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

#### 9.2 Application Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

### Step 10: Post-Deployment Testing

#### 10.1 Functionality Tests
- [ ] Landing page loads
- [ ] Login works for all roles
- [ ] All dashboards accessible
- [ ] Attendance marking works
- [ ] Grade entry works
- [ ] Reports generate correctly
- [ ] Logout works

#### 10.2 Performance Tests
- [ ] Page load times acceptable
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Server response times good

#### 10.3 Security Tests
- [ ] HTTPS working
- [ ] SSL certificate valid
- [ ] Firewall configured
- [ ] No exposed credentials
- [ ] Session security working

---

## Post-Deployment Checklist

### Immediate Tasks
- [ ] Verify all features working
- [ ] Check error logs
- [ ] Monitor server resources
- [ ] Test from different locations
- [ ] Verify SSL certificate
- [ ] Test backup system

### First Week Tasks
- [ ] Monitor error logs daily
- [ ] Check database performance
- [ ] Review user feedback
- [ ] Optimize slow queries
- [ ] Update documentation

### Ongoing Tasks
- [ ] Weekly backup verification
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Regular performance reviews
- [ ] User feedback collection

---

## Rollback Procedure

### If Deployment Fails

#### 1. Stop Application
```bash
pm2 stop college-cms
```

#### 2. Restore Database
```bash
# Find latest backup
ls -lh /var/backups/college-cms/

# Restore backup
gunzip < /var/backups/college-cms/backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u cms_user -p college_management
```

#### 3. Revert Code
```bash
# Go to previous version
git checkout <previous-commit-hash>

# Reinstall dependencies
npm install --production

# Restart application
pm2 restart college-cms
```

---

## Maintenance Commands

### Application Management
```bash
# View logs
pm2 logs college-cms

# Restart application
pm2 restart college-cms

# View status
pm2 status

# Monitor resources
pm2 monit
```

### Database Management
```bash
# Backup database
/usr/local/bin/backup-cms-db.sh

# Check database size
mysql -u cms_user -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = 'college_management';"

# Optimize database
mysqlcheck -u cms_user -p --optimize college_management
```

### Server Management
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs college-cms

# Check port availability
sudo netstat -tulpn | grep :3000

# Check environment variables
cat .env

# Test database connection
node scripts/test-connection.js
```

### Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u cms_user -p college_management

# Check user privileges
mysql -u root -p -e "SHOW GRANTS FOR 'cms_user'@'localhost';"
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test Nginx configuration
sudo nginx -t
```

---

## Security Best Practices

### 1. Regular Updates
```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade

# Update Node.js packages
npm audit
npm audit fix
```

### 2. Password Security
- Use strong passwords (16+ characters)
- Change default passwords
- Use different passwords for each service
- Store passwords securely

### 3. Access Control
- Limit SSH access
- Use SSH keys instead of passwords
- Disable root login
- Use sudo for administrative tasks

### 4. Monitoring
- Monitor error logs daily
- Set up alerts for critical errors
- Track failed login attempts
- Monitor server resources

---

## Support Contacts

### Technical Support
- **Email:** support@yourdomain.com
- **Phone:** +1-XXX-XXX-XXXX
- **Hours:** 9 AM - 5 PM (Mon-Fri)

### Emergency Contact
- **On-Call:** +1-XXX-XXX-XXXX
- **Available:** 24/7

---

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/guide/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)

---

**Deployment Status:** Ready for Production ✅  
**Last Updated:** February 15, 2026  
**Version:** 2.0
