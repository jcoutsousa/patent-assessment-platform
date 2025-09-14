# Secrets Management Guide

This guide provides comprehensive instructions for managing environment variables and secrets in the Patent Assessment Platform.

## 🔐 Environment Variables Setup

### Local Development

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in the required values in `.env`:**
   ```bash
   # Essential for development
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   DATABASE_URL=postgresql://patent_user:patent_dev_password@localhost:5432/patent_assessment
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=$(openssl rand -hex 32)
   JWT_SECRET_KEY=$(openssl rand -hex 32)
   ```

3. **Generate secure random keys:**
   ```bash
   # Generate SECRET_KEY
   openssl rand -hex 32

   # Generate JWT_SECRET_KEY
   openssl rand -hex 32
   ```

### Required Secrets by Category

#### 🔑 **Critical Secrets (Required for Core Functionality)**

| Secret | Purpose | How to Get | Required |
|--------|---------|------------|----------|
| `OPENAI_API_KEY` | GPT-4 analysis | [OpenAI API Keys](https://platform.openai.com/api-keys) | ✅ |
| `DATABASE_URL` | PostgreSQL connection | Set up local PostgreSQL | ✅ |
| `SECRET_KEY` | Session security | `openssl rand -hex 32` | ✅ |
| `JWT_SECRET_KEY` | JWT token signing | `openssl rand -hex 32` | ✅ |

#### 🌐 **Optional Secrets (Enhanced Functionality)**

| Secret | Purpose | How to Get | Impact if Missing |
|--------|---------|------------|------------------|
| `GOOGLE_PATENTS_API_KEY` | Prior art search | [Google Cloud Console](https://console.cloud.google.com/) | Reduced search rate limits |
| `REDIS_URL` | Caching | Set up local Redis | Slower performance |
| `SENTRY_DSN` | Error tracking | [Sentry Dashboard](https://sentry.io/) | No error monitoring |
| `SMTP_*` | Email notifications | Email provider settings | No email features |

## 🚀 Deployment Secrets

### GitHub Actions Secrets

Configure these secrets in your GitHub repository settings (`Settings` > `Secrets and variables` > `Actions`):

#### **Production Secrets:**
```
# Core Application
OPENAI_API_KEY=sk-prod-key-here
DATABASE_URL=postgresql://user:pass@prod-host:5432/patent_assessment
REDIS_URL=redis://prod-redis-host:6379/0
SECRET_KEY=production-secret-key-here
JWT_SECRET_KEY=production-jwt-secret-here

# Frontend
NEXT_PUBLIC_API_URL=https://api.patentassessment.com

# Monitoring
SENTRY_DSN=https://your-sentry-dsn-here

# Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook-url
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

#### **Docker Registry Secrets:**
```
# Automatically configured by GitHub Actions
GITHUB_TOKEN=automatically-provided-by-github
```

### Environment-Specific Configuration

#### **Development Environment:**
```bash
# .env.development
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=postgresql://patent_user:patent_dev_password@localhost:5432/patent_assessment_dev
```

#### **Staging Environment:**
```bash
# .env.staging
ENVIRONMENT=staging
DEBUG=false
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=https://staging-api.patentassessment.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/patent_assessment_staging
```

#### **Production Environment:**
```bash
# .env.production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=warning
NEXT_PUBLIC_API_URL=https://api.patentassessment.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/patent_assessment
```

## 🔒 Security Best Practices

### 1. Secret Rotation Schedule

| Secret Type | Rotation Frequency | Method |
|-------------|-------------------|--------|
| Database passwords | Every 90 days | Update in provider + environment |
| API keys | Every 180 days | Regenerate in service dashboard |
| JWT secrets | Every 30 days | Generate new + update everywhere |
| SSL certificates | Before expiry | Automated via CI/CD |

### 2. Secret Storage Security

#### ✅ **DO:**
- Use environment variables for all secrets
- Store secrets in secure secret management systems
- Use different secrets for each environment
- Rotate secrets regularly
- Use strong, randomly generated passwords
- Enable secret scanning in GitHub
- Review access logs regularly

#### ❌ **DON'T:**
- Commit secrets to version control
- Share secrets via email or chat
- Use default or weak passwords
- Reuse secrets across environments
- Store secrets in code comments
- Use production secrets in development

### 3. Secret Validation

Add this to your application startup to validate required secrets:

```python
# backend/config.py
import os
from typing import Optional

class Config:
    # Required secrets
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")

    def validate_required_secrets(self):
        """Validate that all required secrets are present"""
        missing = []

        if not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY")
        if not self.DATABASE_URL:
            missing.append("DATABASE_URL")
        if not self.SECRET_KEY:
            missing.append("SECRET_KEY")
        if not self.JWT_SECRET_KEY:
            missing.append("JWT_SECRET_KEY")

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
```

## 🛠 Setup Scripts

### Local Development Setup Script

Create `scripts/setup-env.sh`:

```bash
#!/bin/bash

echo "🔧 Setting up environment variables for Patent Assessment Platform..."

# Check if .env already exists
if [[ -f .env ]]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

# Copy template
cp .env.example .env

echo "🔑 Generating secure keys..."

# Generate secure keys
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Replace placeholders in .env file
sed -i.bak "s/your_secret_key_here_change_in_production/$SECRET_KEY/" .env
sed -i.bak "s/your_jwt_secret_key_here/$JWT_SECRET_KEY/" .env

# Clean up backup file
rm .env.bak

echo "✅ Environment file created successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env and add your OpenAI API key"
echo "2. Update database connection strings if needed"
echo "3. Configure optional services (Redis, Sentry, etc.)"
echo ""
echo "📖 See docs/SECRETS_MANAGEMENT.md for detailed setup instructions"
```

### Environment Validation Script

Create `scripts/validate-env.py`:

```python
#!/usr/bin/env python3

import os
import sys
from typing import List, Tuple

def validate_environment() -> Tuple[bool, List[str]]:
    """Validate environment configuration"""

    # Required environment variables
    required_vars = [
        "OPENAI_API_KEY",
        "DATABASE_URL",
        "SECRET_KEY",
        "JWT_SECRET_KEY"
    ]

    # Optional but recommended
    recommended_vars = [
        "REDIS_URL",
        "SENTRY_DSN",
        "NEXT_PUBLIC_API_URL"
    ]

    missing_required = []
    missing_recommended = []

    # Check required variables
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)

    # Check recommended variables
    for var in recommended_vars:
        if not os.getenv(var):
            missing_recommended.append(var)

    # Print results
    if not missing_required and not missing_recommended:
        print("✅ All environment variables are properly configured!")
        return True, []

    if missing_required:
        print("❌ Missing required environment variables:")
        for var in missing_required:
            print(f"   - {var}")
        print()

    if missing_recommended:
        print("⚠️  Missing recommended environment variables:")
        for var in missing_recommended:
            print(f"   - {var}")
        print()

    return len(missing_required) == 0, missing_required + missing_recommended

if __name__ == "__main__":
    is_valid, missing = validate_environment()

    if not is_valid:
        print("🔧 Run 'scripts/setup-env.sh' to configure missing variables")
        sys.exit(1)
    else:
        print("🚀 Environment is ready for development!")
        sys.exit(0)
```

## 📋 Troubleshooting

### Common Issues

#### **Issue: "Missing OPENAI_API_KEY"**
```bash
# Solution: Get API key from OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Add to .env: OPENAI_API_KEY=sk-your-key-here
```

#### **Issue: "Database connection failed"**
```bash
# Solution: Check database configuration
1. Ensure PostgreSQL is running: brew services start postgresql
2. Create database: createdb patent_assessment_dev
3. Update DATABASE_URL in .env
```

#### **Issue: "Redis connection failed"**
```bash
# Solution: Install and start Redis
1. Install: brew install redis
2. Start: brew services start redis
3. Update REDIS_URL in .env
```

#### **Issue: "JWT token invalid"**
```bash
# Solution: Regenerate JWT secret
1. Generate new key: openssl rand -hex 32
2. Update JWT_SECRET_KEY in .env
3. Restart application
```

### Security Checklist

Before deploying to production:

- [ ] All secrets use strong, randomly generated values
- [ ] No secrets committed to version control
- [ ] Production secrets different from development
- [ ] Secret scanning enabled in GitHub
- [ ] Regular secret rotation schedule established
- [ ] Access to secrets limited to necessary personnel
- [ ] Backup and recovery plan for secrets in place
- [ ] Monitoring and alerting configured for secret access

---

## 🆘 Need Help?

- **Development Setup Issues:** Check the main README.md
- **Security Concerns:** Contact the security team
- **API Key Issues:** Refer to service provider documentation
- **Production Deployment:** Follow the deployment guide

Remember: **Never share secrets in plain text or commit them to version control!** 🔒