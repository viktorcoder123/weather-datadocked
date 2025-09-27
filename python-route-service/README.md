# Maritime Route Service

This service provides realistic maritime routing using the `searoute` Python library, which calculates routes that follow actual shipping lanes and avoid land masses.

## Features

- **Realistic Maritime Routing**: Uses actual shipping lanes instead of straight-line distances
- **Port Database**: Comprehensive database of major world ports with coordinates
- **Route Timing**: Calculates estimated arrival times based on vessel speed
- **Distance Calculation**: Provides both kilometer and nautical mile distances
- **Fallback Support**: Frontend falls back to great-circle routing if service unavailable

## Installation

1. **Prerequisites**: Python 3.8 or higher

2. **Setup the service**:
   ```bash
   cd python-route-service
   ./setup.sh
   ```

3. **Manual setup** (if script doesn't work):
   ```bash
   cd python-route-service
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Running the Service

1. **Start the route service**:
   ```bash
   cd python-route-service
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python app.py
   ```

2. **Service will be available at**: `http://localhost:5000`

## API Endpoints

### POST /route
Calculate maritime route between two points.

**Request Body**:
```json
{
  "start_lat": 48.88508,
  "start_lng": -4.40579,
  "destination": "Portsmouth, United Kingdom (UK)",
  "speed": 14.1
}
```

**Response**:
```json
{
  "success": true,
  "route": {
    "waypoints": [
      {
        "lat": 48.88508,
        "lng": -4.40579,
        "estimated_time": "2025-09-27T10:00:00",
        "distance_from_start": 0
      }
    ],
    "total_distance_nm": 156.2,
    "estimated_duration_hours": 11.08,
    "estimated_arrival": "2025-09-27T21:05:00"
  }
}
```

### GET /ports
List all available ports with coordinates.

### POST /distance
Calculate maritime distance between two points.

### GET /health
Health check endpoint.

## Supported Ports

The service includes coordinates for major ports worldwide:

**Europe**: Portsmouth, Southampton, Hamburg, Rotterdam, Antwerp, Le Havre, Bilbao, Barcelona, Marseille, Genoa, Naples, Piraeus, Istanbul

**Americas**: New York, Los Angeles, Miami, Houston, Vancouver, Panama City, Santos, Buenos Aires

**Asia-Pacific**: Singapore, Hong Kong, Shanghai, Tokyo, Sydney, Melbourne, Auckland

**Others**: Dubai, Mumbai, Cape Town, Lagos, Alexandria, Suez

## Integration with Frontend

The frontend automatically:

1. **Tries searoute service** first for realistic maritime routing
2. **Falls back gracefully** to great-circle calculation if service unavailable
3. **Shows route status** in the UI (Maritime route vs Great Circle fallback)

## Benefits of Searoute vs Great Circle

**Great Circle Route** (fallback):
- Direct line between two points
- Ignores land masses and shipping restrictions
- May go over land or through restricted waters

**Searoute Maritime Route**:
- ✅ Follows actual shipping lanes
- ✅ Avoids land masses automatically
- ✅ Respects maritime traffic separation schemes
- ✅ More accurate distance and time estimates
- ✅ Realistic for actual vessel navigation

## Example Route Differences

**GALICIA (Bilbao to Portsmouth)**:
- **Great Circle**: ~180nm direct line (may cross land)
- **Searoute**: ~220nm following Bay of Biscay shipping lanes

The searoute provides the realistic path a vessel would actually take, accounting for coastal navigation and traffic separation schemes.

## Troubleshooting

**Service not starting?**
- Check Python 3.8+ is installed: `python3 --version`
- Ensure all dependencies installed: `pip list`
- Check port 5000 is available: `lsof -i :5000`

**Route calculation failing?**
- Verify coordinates are valid latitude/longitude
- Check destination port name is in the database
- Ensure start/end points are accessible by sea

**Frontend showing "Great Circle" instead of "Maritime"?**
- Route service may not be running
- Check browser console for connection errors
- Verify service is accessible at `http://localhost:5000/health`