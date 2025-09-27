#!/usr/bin/env python3
"""
Maritime Route Service using searoute
Provides realistic maritime routing that follows shipping lanes and avoids land
"""

import os
import sys
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
import searoute as sr
import json
from datetime import datetime, timedelta
from port_service import find_port_coordinates, get_port_service

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Port coordinates database (expanded from our frontend version)
PORT_COORDINATES = {
    'Portsmouth, United Kingdom (UK)': [50.8198, -1.0880],
    'Portsmouth': [50.8198, -1.0880],
    'Southampton': [50.9097, -1.4044],
    'London': [51.5074, -0.1278],
    'Hamburg': [53.5511, 9.9937],
    'Rotterdam': [51.9244, 4.4777],
    'Antwerp': [51.2194, 4.4025],
    'Le Havre': [49.4944, 0.1079],
    'Bilbao': [43.2627, -2.9253],
    'Barcelona': [41.3851, 2.1734],
    'Marseille': [43.2965, 5.3698],
    'Genoa': [44.4056, 8.9463],
    'Naples': [40.8518, 14.2681],
    'Piraeus': [37.9472, 23.6348],
    'Istanbul': [41.0082, 28.9784],
    'New York': [40.6892, -74.0445],
    'Los Angeles': [33.7174, -118.2517],
    'Miami': [25.7617, -80.1918],
    'Houston': [29.7604, -95.3698],
    'Vancouver': [49.2827, -123.1207],
    'Singapore': [1.2966, 103.7764],
    'Hong Kong': [22.3193, 114.1694],
    'Shanghai': [31.2304, 121.4737],
    'Tokyo': [35.6762, 139.6503],
    'Dubai': [25.2048, 55.2708],
    'Mumbai': [19.0760, 72.8777],
    'Cape Town': [-33.9249, 18.4241],
    'Lagos': [6.4281, 3.4219],
    'Alexandria': [31.2001, 29.9187],
    'Suez': [29.9668, 32.5498],
    'Panama City': [8.9824, -79.5199],
    'Santos': [-23.9608, -46.3331],
    'Buenos Aires': [-34.6118, -58.3960],
    'Sydney': [-33.8688, 151.2093],
    'Melbourne': [-37.8136, 144.9631],
    'Auckland': [-36.8485, 174.7633],
    'Amsterdam': [52.3676, 4.9041],
    'Amsterdam, Netherlands': [52.3676, 4.9041]
}

async def find_port_coordinates_async(destination_name):
    """Find coordinates for a destination port using async port service"""
    return await find_port_coordinates(destination_name)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "maritime-route-service"})

@app.route('/route', methods=['POST'])
def calculate_route():
    """Calculate maritime route using searoute"""
    try:
        data = request.get_json()

        # Extract vessel data
        start_lat = float(data.get('start_lat'))
        start_lng = float(data.get('start_lng'))
        end_lat = float(data.get('end_lat', 0))
        end_lng = float(data.get('end_lng', 0))
        destination = data.get('destination', '')
        vessel_speed = float(data.get('speed', 15))  # knots

        # If no end coordinates provided, try to find them from destination
        if (end_lat == 0 and end_lng == 0) and destination:
            # Use asyncio to run the async port lookup
            coords = asyncio.run(find_port_coordinates_async(destination))
            if coords:
                end_lat, end_lng = coords
            else:
                port_service = get_port_service()
                available_ports = port_service.get_available_ports_sample()
                return jsonify({
                    "error": f"Could not find coordinates for destination: {destination}",
                    "available_ports": available_ports,
                    "note": "Using Supabase database with 7,799+ ports and fallback to hardcoded ports"
                }), 400

        if end_lat == 0 and end_lng == 0:
            return jsonify({"error": "End coordinates or valid destination required"}), 400

        # Calculate route using searoute
        print(f"Calculating route from [{start_lat}, {start_lng}] to [{end_lat}, {end_lng}]")

        try:
            # Use searoute to calculate the maritime route
            route = sr.searoute(
                origin=[start_lng, start_lat],  # searoute expects [lng, lat]
                destination=[end_lng, end_lat],
                units="km"
            )

            # Extract route information
            if route and 'geometry' in route and 'coordinates' in route['geometry']:
                coordinates = route['geometry']['coordinates']
                total_distance_km = route['properties']['length']
                total_distance_nm = total_distance_km * 0.539957  # Convert km to nautical miles

                # Create waypoints with timing information
                waypoints = []
                current_time = datetime.now()
                cumulative_distance = 0

                for i, coord in enumerate(coordinates):
                    lng, lat = coord

                    if i > 0:
                        # Calculate distance from previous point
                        prev_lng, prev_lat = coordinates[i-1]
                        # Simple distance calculation (could be improved)
                        segment_distance = ((lat - prev_lat)**2 + (lng - prev_lng)**2)**0.5 * 60  # Rough nm
                        cumulative_distance += segment_distance

                    # Calculate estimated time
                    hours_elapsed = cumulative_distance / vessel_speed if vessel_speed > 0 else 0
                    estimated_time = current_time + timedelta(hours=hours_elapsed)

                    waypoint = {
                        "lat": lat,
                        "lng": lng,
                        "estimated_time": estimated_time.isoformat(),
                        "distance_from_start": cumulative_distance,
                        "segment_index": i
                    }
                    waypoints.append(waypoint)

                # Create route summary
                route_duration_hours = total_distance_nm / vessel_speed if vessel_speed > 0 else 0
                estimated_arrival = current_time + timedelta(hours=route_duration_hours)

                response = {
                    "success": True,
                    "route": {
                        "waypoints": waypoints,
                        "total_distance_nm": round(total_distance_nm, 2),
                        "total_distance_km": round(total_distance_km, 2),
                        "estimated_duration_hours": round(route_duration_hours, 2),
                        "estimated_arrival": estimated_arrival.isoformat(),
                        "vessel_speed": vessel_speed,
                        "waypoint_count": len(waypoints)
                    },
                    "origin": {"lat": start_lat, "lng": start_lng},
                    "destination": {"lat": end_lat, "lng": end_lng, "name": destination},
                    "metadata": {
                        "route_type": "maritime",
                        "calculation_method": "searoute",
                        "timestamp": datetime.now().isoformat()
                    }
                }

                return jsonify(response)

            else:
                return jsonify({"error": "No valid route found between the specified points"}), 404

        except Exception as searoute_error:
            print(f"Searoute calculation error: {searoute_error}")
            return jsonify({
                "error": f"Route calculation failed: {str(searoute_error)}",
                "fallback_needed": True
            }), 500

    except Exception as e:
        print(f"Route calculation error: {e}")
        return jsonify({"error": f"Route calculation failed: {str(e)}"}), 500

@app.route('/ports', methods=['GET'])
def list_ports():
    """Get list of available ports with coordinates"""
    return jsonify({
        "ports": [
            {"name": name, "coordinates": coords}
            for name, coords in PORT_COORDINATES.items()
        ]
    })

@app.route('/distance', methods=['POST'])
def calculate_distance():
    """Calculate maritime distance between two points"""
    try:
        data = request.get_json()
        start_lat = float(data.get('start_lat'))
        start_lng = float(data.get('start_lng'))
        end_lat = float(data.get('end_lat'))
        end_lng = float(data.get('end_lng'))

        # Use searoute for distance calculation
        route = sr.searoute(
            origin=[start_lng, start_lat],
            destination=[end_lng, end_lat],
            units="km"
        )

        if route and 'properties' in route:
            distance_km = route['properties']['length']
            distance_nm = distance_km * 0.539957

            return jsonify({
                "distance_km": round(distance_km, 2),
                "distance_nm": round(distance_nm, 2),
                "success": True
            })
        else:
            return jsonify({"error": "Could not calculate maritime distance"}), 400

    except Exception as e:
        return jsonify({"error": f"Distance calculation failed: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'

    print("=== Maritime Route Service ===")
    print(f"Starting on port {port}")
    print(f"Debug mode: {debug}")
    print(f"Available ports: {len(PORT_COORDINATES)}")

    app.run(host='0.0.0.0', port=port, debug=debug)