#!/bin/bash

# Patent Assessment Platform - Environment Setup Script
# This script helps set up environment variables for local development

set -e  # Exit on any error

echo "🔧 Setting up environment variables for Patent Assessment Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required commands exist
check_dependencies() {
    echo "Checking dependencies..."

    if ! command -v openssl &> /dev/null; then
        print_error "openssl is required but not installed. Please install it first."
        exit 1
    fi

    print_status "All dependencies found"
}

# Main setup function
setup_environment() {
    # Check if .env already exists
    if [[ -f .env ]]; then
        print_warning ".env file already exists"
        echo "Do you want to backup and recreate it? (y/N)"
        read -r response
        if [[ $response =~ ^[Yy]$ ]]; then
            backup_name=".env.backup.$(date +%Y%m%d_%H%M%S)"
            cp .env "$backup_name"
            print_status "Existing .env backed up to $backup_name"
        else
            print_info "Keeping existing .env file. You can manually update it if needed."
            exit 0
        fi
    fi

    # Check if .env.example exists
    if [[ ! -f .env.example ]]; then
        print_error ".env.example file not found. Please ensure you're in the project root directory."
        exit 1
    fi

    # Copy template
    cp .env.example .env
    print_status "Copied .env.example to .env"

    # Generate secure keys
    echo "🔑 Generating secure keys..."

    SECRET_KEY=$(openssl rand -hex 32)
    JWT_SECRET_KEY=$(openssl rand -hex 32)

    print_status "Generated SECRET_KEY"
    print_status "Generated JWT_SECRET_KEY"

    # Replace placeholders in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your_secret_key_here_change_in_production/$SECRET_KEY/" .env
        sed -i '' "s/your_jwt_secret_key_here/$JWT_SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/your_secret_key_here_change_in_production/$SECRET_KEY/" .env
        sed -i "s/your_jwt_secret_key_here/$JWT_SECRET_KEY/" .env
    fi

    print_status "Updated .env with generated keys"
}

# Prompt for essential configuration
prompt_essential_config() {
    echo ""
    echo "🎯 Essential Configuration"
    echo "The following secrets are required for the application to work:"
    echo ""

    # OpenAI API Key
    echo "1. OpenAI API Key (required for AI analysis)"
    echo "   Get it from: https://platform.openai.com/api-keys"
    echo "   Enter your OpenAI API key (or press Enter to skip):"
    read -r openai_key

    if [[ -n $openai_key ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/your_openai_api_key_here/$openai_key/" .env
        else
            sed -i "s/your_openai_api_key_here/$openai_key/" .env
        fi
        print_status "OpenAI API key configured"
    else
        print_warning "OpenAI API key not configured. Add it manually to .env file."
    fi

    echo ""
    echo "2. Database Configuration"
    echo "   Current setting: postgresql://patent_user:patent_dev_password@localhost:5432/patent_assessment"
    echo "   Is this correct for your setup? (Y/n)"
    read -r db_response

    if [[ $db_response =~ ^[Nn]$ ]]; then
        echo "   Enter your database URL:"
        read -r db_url
        if [[ -n $db_url ]]; then
            escaped_db_url=$(echo "$db_url" | sed 's/[[\.*^$()+?{|]/\\&/g')
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|postgresql://patent_user:patent_dev_password@localhost:5432/patent_assessment|$escaped_db_url|" .env
            else
                sed -i "s|postgresql://patent_user:patent_dev_password@localhost:5432/patent_assessment|$escaped_db_url|" .env
            fi
            print_status "Database URL updated"
        fi
    else
        print_status "Using default database configuration"
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    echo "🚀 Setup Complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Review and edit .env file if needed"
    echo "2. Ensure PostgreSQL is running: brew services start postgresql"
    echo "3. Create the database: createdb patent_assessment_dev"
    echo "4. Install Redis (optional): brew install redis && brew services start redis"
    echo "5. Run database migrations: cd backend && alembic upgrade head"
    echo "6. Start the development servers:"
    echo "   - Backend: cd backend && uvicorn main:app --reload"
    echo "   - Frontend: cd frontend && npm run dev"
    echo ""
    echo "📖 For detailed setup instructions, see:"
    echo "   - README.md (main setup guide)"
    echo "   - docs/SECRETS_MANAGEMENT.md (secrets guide)"
    echo ""
    echo "🔍 To validate your environment setup:"
    echo "   python scripts/validate-env.py"
}

# Main execution
main() {
    echo "Patent Assessment Platform - Environment Setup"
    echo "============================================="
    echo ""

    check_dependencies
    setup_environment
    prompt_essential_config
    show_next_steps

    echo ""
    print_status "Environment setup completed successfully!"
}

# Run main function
main "$@"