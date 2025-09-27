#!/bin/bash

echo "=== Maritime Route Service Setup ==="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "Setup complete! To start the route service:"
echo "  cd python-route-service"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "The service will be available at http://localhost:5000"