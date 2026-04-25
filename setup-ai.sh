#!/bin/bash

# RepoViz AI Analysis Setup Script
# This script sets up the Google Gemini API integration

echo "🚀 RepoViz AI Analysis Setup"
echo "=============================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file already exists"
else
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Open .env.local and add your Google Gemini API key"
echo "   Get it from: https://makersuite.google.com/app/apikey"
echo ""
echo "2. (Optional) Add GitHub Personal Access Token for higher rate limits"
echo "   Get it from: https://github.com/settings/tokens"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "📚 For detailed setup instructions, see SETUP_AI_ANALYSIS.md"
echo ""
