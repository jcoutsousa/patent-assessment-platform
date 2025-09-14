#!/usr/bin/env python3

"""
Patent Assessment Platform - Environment Validation Script

This script validates that all required environment variables are properly configured
for local development and deployment.
"""

import os
import sys
import re
from typing import List, Tuple, Dict, Optional
from urllib.parse import urlparse

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    BOLD = '\033[1m'
    NC = '\033[0m'  # No Color

def print_status(message: str) -> None:
    """Print success message in green"""
    print(f"{Colors.GREEN}✅ {message}{Colors.NC}")

def print_error(message: str) -> None:
    """Print error message in red"""
    print(f"{Colors.RED}❌ {message}{Colors.NC}")

def print_warning(message: str) -> None:
    """Print warning message in yellow"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.NC}")

def print_info(message: str) -> None:
    """Print info message in blue"""
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.NC}")

def print_header(message: str) -> None:
    """Print header message in bold"""
    print(f"\n{Colors.BOLD}{message}{Colors.NC}")

class EnvironmentValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

        # Required environment variables
        self.required_vars = [
            {
                'name': 'OPENAI_API_KEY',
                'description': 'OpenAI API key for GPT-4 analysis',
                'validator': self.validate_openai_key,
                'critical': True
            },
            {
                'name': 'DATABASE_URL',
                'description': 'PostgreSQL database connection URL',
                'validator': self.validate_database_url,
                'critical': True
            },
            {
                'name': 'SECRET_KEY',
                'description': 'Secret key for session security',
                'validator': self.validate_secret_key,
                'critical': True
            },
            {
                'name': 'JWT_SECRET_KEY',
                'description': 'JWT token signing secret',
                'validator': self.validate_secret_key,
                'critical': True
            }
        ]

        # Recommended environment variables
        self.recommended_vars = [
            {
                'name': 'REDIS_URL',
                'description': 'Redis URL for caching',
                'validator': self.validate_redis_url,
                'critical': False
            },
            {
                'name': 'NEXT_PUBLIC_API_URL',
                'description': 'Frontend API URL',
                'validator': self.validate_api_url,
                'critical': False
            },
            {
                'name': 'ENVIRONMENT',
                'description': 'Application environment',
                'validator': self.validate_environment,
                'critical': False
            }
        ]

        # Optional environment variables
        self.optional_vars = [
            'SENTRY_DSN',
            'GOOGLE_PATENTS_API_KEY',
            'GOOGLE_CUSTOM_SEARCH_ENGINE_ID',
            'SMTP_HOST',
            'SMTP_USERNAME',
            'AWS_ACCESS_KEY_ID',
            'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'
        ]

    def validate_openai_key(self, value: str) -> Tuple[bool, Optional[str]]:
        """Validate OpenAI API key format"""
        if not value:
            return False, "OpenAI API key is required"

        if not value.startswith('sk-'):
            return False, "OpenAI API key must start with 'sk-'"

        if len(value) < 20:
            return False, "OpenAI API key appears to be too short"

        # Check for placeholder values
        if value in ['your_openai_api_key_here', 'sk-your-openai-api-key-here']:
            return False, "Please replace with your actual OpenAI API key"

        return True, None

    def validate_database_url(self, value: str) -> Tuple[bool, Optional[str]]:
        """Validate database URL format"""
        if not value:
            return False, "Database URL is required"

        try:
            parsed = urlparse(value)
            if parsed.scheme != 'postgresql':
                return False, "Database URL must use postgresql:// scheme"

            if not parsed.hostname:
                return False, "Database URL must include hostname"

            if not parsed.path or parsed.path == '/':
                return False, "Database URL must include database name"

            return True, None
        except Exception as e:
            return False, f"Invalid database URL format: {str(e)}"

    def validate_redis_url(self, value: str) -> Tuple[bool, Optional[str]]:
        """Validate Redis URL format"""
        if not value:
            return False, "Redis URL is recommended for caching"

        try:
            parsed = urlparse(value)
            if parsed.scheme != 'redis':
                return False, "Redis URL must use redis:// scheme"

            return True, None
        except Exception as e:
            return False, f"Invalid Redis URL format: {str(e)}"

    def validate_secret_key(self, value: str) -> Tuple[bool, Optional[str]]:
        """Validate secret key strength"""
        if not value:
            return False, "Secret key is required"

        if len(value) < 32:
            return False, "Secret key should be at least 32 characters long"

        # Check for placeholder values
        placeholder_patterns = [
            'your_secret_key_here',
            'your_jwt_secret_key_here',
            'change_in_production'
        ]

        for pattern in placeholder_patterns:
            if pattern in value:
                return False, "Please replace placeholder with actual secret key"

        return True, None

    def validate_api_url(self, value: str) -> Tuple[bool, Optional[str]]:
        """Validate API URL format"""
        if not value:
            return False, "API URL is recommended for frontend"

        try:
            parsed = urlparse(value)
            if not parsed.scheme or parsed.scheme not in ['http', 'https']:
                return False, "API URL must use http:// or https:// scheme"

            if not parsed.hostname:
                return False, "API URL must include hostname"

            return True, None
        except Exception as e:
            return False, f"Invalid API URL format: {str(e)}"

    def validate_environment(self, value: str) -> Tuple[bool, Optional[str]]:
        """Validate environment setting"""
        if not value:
            return False, "Environment should be specified"

        valid_envs = ['development', 'staging', 'production', 'test']
        if value not in valid_envs:
            return False, f"Environment should be one of: {', '.join(valid_envs)}"

        return True, None

    def check_variable(self, var_config: Dict) -> bool:
        """Check a single environment variable"""
        name = var_config['name']
        description = var_config['description']
        validator = var_config['validator']
        critical = var_config['critical']

        value = os.getenv(name)

        if not value:
            message = f"{name}: {description}"
            if critical:
                self.errors.append(message)
                return False
            else:
                self.warnings.append(message)
                return False

        is_valid, error_msg = validator(value)
        if not is_valid:
            message = f"{name}: {error_msg}"
            if critical:
                self.errors.append(message)
                return False
            else:
                self.warnings.append(message)
                return False

        return True

    def check_optional_variables(self) -> None:
        """Check optional environment variables"""
        configured_optional = []
        for var_name in self.optional_vars:
            if os.getenv(var_name):
                configured_optional.append(var_name)

        if configured_optional:
            self.info.append(f"Optional variables configured: {', '.join(configured_optional)}")

    def validate_environment_consistency(self) -> None:
        """Check for environment-specific consistency"""
        env = os.getenv('ENVIRONMENT', 'development')
        debug = os.getenv('DEBUG', 'true').lower()

        if env == 'production' and debug == 'true':
            self.warnings.append("DEBUG=true in production environment - should be false")

        if env == 'development' and debug == 'false':
            self.info.append("DEBUG=false in development - this is fine but unusual")

        # Check API URL consistency
        api_url = os.getenv('NEXT_PUBLIC_API_URL', '')
        if env == 'production' and 'localhost' in api_url:
            self.errors.append("Production environment should not use localhost API URL")

    def run_validation(self) -> Tuple[bool, int, int, int]:
        """Run complete environment validation"""
        print_header("🔍 Patent Assessment Platform - Environment Validation")

        # Check required variables
        print("\n📋 Checking required environment variables...")
        required_valid = 0
        for var_config in self.required_vars:
            if self.check_variable(var_config):
                required_valid += 1
                print_status(f"{var_config['name']}: ✓")
            else:
                print_error(f"{var_config['name']}: ✗")

        # Check recommended variables
        print("\n📋 Checking recommended environment variables...")
        recommended_valid = 0
        for var_config in self.recommended_vars:
            if self.check_variable(var_config):
                recommended_valid += 1
                print_status(f"{var_config['name']}: ✓")
            else:
                print_warning(f"{var_config['name']}: ✗")

        # Check optional variables
        self.check_optional_variables()

        # Validate consistency
        self.validate_environment_consistency()

        # Print summary
        print_header("📊 Validation Summary")

        if not self.errors:
            print_status("All required environment variables are properly configured!")
        else:
            print_error(f"Found {len(self.errors)} critical issues:")
            for error in self.errors:
                print(f"  • {error}")

        if self.warnings:
            print_warning(f"Found {len(self.warnings)} warnings:")
            for warning in self.warnings:
                print(f"  • {warning}")

        if self.info:
            print_info("Additional information:")
            for info in self.info:
                print(f"  • {info}")

        is_valid = len(self.errors) == 0
        return is_valid, len(self.errors), len(self.warnings), required_valid + recommended_valid

def main():
    """Main execution function"""
    validator = EnvironmentValidator()
    is_valid, error_count, warning_count, valid_count = validator.run_validation()

    print_header("🎯 Next Steps")

    if not is_valid:
        print_error(f"Environment validation failed with {error_count} errors")
        print("\n🔧 To fix issues:")
        print("1. Run 'scripts/setup-env.sh' to configure missing variables")
        print("2. Edit .env file manually to fix validation errors")
        print("3. See docs/SECRETS_MANAGEMENT.md for detailed guidance")
        sys.exit(1)

    if warning_count > 0:
        print_warning(f"Environment validation passed with {warning_count} warnings")
        print("Consider addressing warnings for optimal functionality.")
    else:
        print_status("Environment validation passed with no issues!")

    print("\n🚀 Your environment is ready for development!")
    print("\n📖 Next steps:")
    print("• Start PostgreSQL: brew services start postgresql")
    print("• Start Redis (optional): brew services start redis")
    print("• Run migrations: cd backend && alembic upgrade head")
    print("• Start backend: cd backend && uvicorn main:app --reload")
    print("• Start frontend: cd frontend && npm run dev")

    sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Validation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error during validation: {str(e)}")
        sys.exit(1)