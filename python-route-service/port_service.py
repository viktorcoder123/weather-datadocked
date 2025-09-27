#!/usr/bin/env python3
"""
Port lookup service with Supabase integration and fallback to hardcoded ports
"""

import os
import logging
from typing import Optional, Tuple, Dict, List
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://vehdynzdfxbacnsynvnj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGR5bnpkZnhiYWNuc3ludm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NjYxNDQsImV4cCI6MjA3NDU0MjE0NH0.OpIyDoA0cLuNZQIvvfl6GjXrsUx3ewV1kvVRekfJmzk"

class PortService:
    def __init__(self):
        """Initialize the port service with Supabase client and fallback data"""
        self.supabase_client = None
        self._initialize_supabase()
        self._load_fallback_ports()

    def _initialize_supabase(self):
        """Initialize Supabase client"""
        try:
            self.supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.supabase_client = None

    def _load_fallback_ports(self):
        """Load hardcoded port coordinates as fallback"""
        # UNLOCODE to port name mapping
        self.unlocode_mapping = {
            'EETLL': 'Tallinn, Estonia',
            'BEANR': 'Antwerp, Belgium',
            'BEZEE': 'Zeebrugge, Belgium',
            'NLAMS': 'Amsterdam, Netherlands',
            'NLRTM': 'Rotterdam, Netherlands',
            'DKHAM': 'Hamburg, Germany',
            'GBSOU': 'Southampton, United Kingdom',
            'GBLON': 'London, United Kingdom',
            'GBPME': 'Portsmouth, United Kingdom',
            'FRLEH': 'Le Havre, France',
            'ESBIL': 'Bilbao, Spain',
            'ESBAR': 'Barcelona, Spain',
            'FRMAR': 'Marseille, France',
            'ITGOA': 'Genoa, Italy',
            'ITNAP': 'Naples, Italy',
            'GRPIR': 'Piraeus, Greece',
            'TRIST': 'Istanbul, Turkey',
            'USNYC': 'New York, United States',
            'USLAX': 'Los Angeles, United States',
            'USMIA': 'Miami, United States',
            'USHOU': 'Houston, United States',
            'USCLE': 'Cleveland, United States',
            'CAVAN': 'Vancouver, Canada',
            'SGSIN': 'Singapore',
            'HKHKG': 'Hong Kong',
            'CNSHA': 'Shanghai, China',
            'JPTYO': 'Tokyo, Japan',
            'AEDXB': 'Dubai, UAE',
            'INBOM': 'Mumbai, India',
            'ZACPT': 'Cape Town, South Africa',
            'NGLOS': 'Lagos, Nigeria',
            'EGALY': 'Alexandria, Egypt',
            'EGSKI': 'Suez, Egypt',
            'PAPTY': 'Panama City, Panama',
            'BRSSZ': 'Santos, Brazil',
            'ARBUE': 'Buenos Aires, Argentina',
            'AUSYD': 'Sydney, Australia',
            'AUMEL': 'Melbourne, Australia',
            'NZAKL': 'Auckland, New Zealand',
            'BRPNG': 'Paranaguá, Brazil'
        }

        self.fallback_ports = {
            'Portsmouth, United Kingdom (UK)': (50.8198, -1.0880),
            'Portsmouth': (50.8198, -1.0880),
            'Southampton': (50.9097, -1.4044),
            'London': (51.5074, -0.1278),
            'Hamburg': (53.5511, 9.9937),
            'Rotterdam': (51.9244, 4.4777),
            'Amsterdam': (52.3676, 4.9041),
            'Amsterdam, Netherlands': (52.3676, 4.9041),
            'Antwerp': (51.2194, 4.4025),
            'Le Havre': (49.4944, 0.1079),
            'Bilbao': (43.2627, -2.9253),
            'Barcelona': (41.3851, 2.1734),
            'Marseille': (43.2965, 5.3698),
            'Genoa': (44.4056, 8.9463),
            'Naples': (40.8518, 14.2681),
            'Piraeus': (37.9472, 23.6348),
            'Istanbul': (41.0082, 28.9784),
            'New York': (40.6892, -74.0445),
            'Los Angeles': (33.7174, -118.2517),
            'Miami': (25.7617, -80.1918),
            'Houston': (29.7604, -95.3698),
            'Cleveland': (41.4993, -81.6944),
            'Cleveland, United States': (41.4993, -81.6944),
            'Cleveland, United States (USA)': (41.4993, -81.6944),
            'Zeebrugge': (51.3333, 3.2167),
            'Zeebrugge, Belgium': (51.3333, 3.2167),
            'Vancouver': (49.2827, -123.1207),
            'Singapore': (1.2966, 103.7764),
            'Hong Kong': (22.3193, 114.1694),
            'Shanghai': (31.2304, 121.4737),
            'Tokyo': (35.6762, 139.6503),
            'Dubai': (25.2048, 55.2708),
            'Mumbai': (19.0760, 72.8777),
            'Cape Town': (-33.9249, 18.4241),
            'Lagos': (6.4281, 3.4219),
            'Alexandria': (31.2001, 29.9187),
            'Suez': (29.9668, 32.5498),
            'Panama City': (8.9824, -79.5199),
            'Santos': (-23.9608, -46.3331),
            'Buenos Aires': (-34.6118, -58.3960),
            'Sydney': (-33.8688, 151.2093),
            'Melbourne': (-37.8136, 144.9631),
            'Auckland': (-36.8485, 174.7633),
            'Paranaguá': (-25.5163, -48.5082),
            'Paranagua, Brazil': (-25.5163, -48.5082),
            'Tallinn': (59.4370, 24.7536),
            'Tallinn, Estonia': (59.4370, 24.7536)
        }

    async def find_port_coordinates_supabase(self, destination_name: str) -> Optional[Tuple[float, float]]:
        """
        Find port coordinates using Supabase database
        """
        if not self.supabase_client or not destination_name:
            return None

        try:
            logger.info(f"Searching Supabase for port: {destination_name}")

            # First try exact match
            response = self.supabase_client.table('ports').select('latitude, longitude, port_name').eq('port_name', destination_name.strip()).eq('is_active', True).limit(1).execute()

            if response.data and len(response.data) > 0:
                port = response.data[0]
                logger.info(f"Found exact match in Supabase: {port['port_name']}")
                return (float(port['latitude']), float(port['longitude']))

            # Try fuzzy search
            query = destination_name.strip()
            response = self.supabase_client.table('ports').select('latitude, longitude, port_name, un_locode, alternative_names').or_(f'port_name.ilike.%{query}%,un_locode.ilike.%{query}%').eq('is_active', True).not_('latitude', 'is', None).not_('longitude', 'is', None).order('port_name').limit(5).execute()

            if response.data and len(response.data) > 0:
                # Find best match
                best_match = None
                query_lower = query.lower()

                for port in response.data:
                    port_name = port['port_name'].lower()
                    un_locode = (port['un_locode'] or '').lower()
                    alt_names = port.get('alternative_names', []) or []

                    # Check for substring matches
                    if (query_lower in port_name or port_name in query_lower or
                        query_lower in un_locode or un_locode in query_lower):
                        best_match = port
                        break

                    # Check alternative names
                    for alt_name in alt_names:
                        alt_lower = alt_name.lower()
                        if query_lower in alt_lower or alt_lower in query_lower:
                            best_match = port
                            break

                    if best_match:
                        break

                selected_port = best_match or response.data[0]
                logger.info(f"Found fuzzy match in Supabase: {selected_port['port_name']} ({selected_port.get('un_locode', 'N/A')})")
                return (float(selected_port['latitude']), float(selected_port['longitude']))

            logger.info(f"No match found in Supabase for: {destination_name}")
            return None

        except Exception as e:
            logger.error(f"Error querying Supabase for port {destination_name}: {e}")
            return None

    def find_port_coordinates_fallback(self, destination_name: str) -> Optional[Tuple[float, float]]:
        """
        Find port coordinates using hardcoded fallback database
        """
        if not destination_name:
            return None

        logger.info(f"Searching fallback database for port: {destination_name}")

        # Try exact match first
        if destination_name in self.fallback_ports:
            coords = self.fallback_ports[destination_name]
            logger.info(f"Found exact match in fallback: {destination_name}")
            return coords

        # Try partial match
        destination_lower = destination_name.lower()
        for port, coords in self.fallback_ports.items():
            if (destination_lower in port.lower() or
                port.lower() in destination_lower):
                logger.info(f"Found partial match in fallback: {port}")
                return coords

        logger.info(f"No match found in fallback for: {destination_name}")
        return None

    async def find_port_coordinates(self, destination_name: str) -> Optional[Tuple[float, float]]:
        """
        Find port coordinates with fallback hierarchy:
        1. Check if destination is a UNLOCODE and convert to port name
        2. Try Supabase database
        3. Fall back to hardcoded ports
        4. Return None if not found
        """
        if not destination_name:
            return None

        logger.info(f"Looking up port coordinates for: {destination_name}")

        # Check if destination_name is a UNLOCODE (e.g., "EETLL")
        original_destination = destination_name
        if destination_name.upper() in self.unlocode_mapping:
            destination_name = self.unlocode_mapping[destination_name.upper()]
            logger.info(f"UNLOCODE {original_destination} mapped to: {destination_name}")

        # Try Supabase first
        coords = await self.find_port_coordinates_supabase(destination_name)
        if coords:
            logger.info(f"Found coordinates via Supabase: {coords}")
            return coords

        # Fall back to hardcoded ports
        coords = self.find_port_coordinates_fallback(destination_name)
        if coords:
            logger.info(f"Found coordinates via fallback: {coords}")
            return coords

        # If we converted from UNLOCODE but still no match, try the original UNLOCODE in Supabase
        if original_destination != destination_name:
            logger.info(f"Trying original UNLOCODE {original_destination} in Supabase")
            coords = await self.find_port_coordinates_supabase(original_destination)
            if coords:
                logger.info(f"Found coordinates via Supabase using UNLOCODE: {coords}")
                return coords

        logger.warning(f"No coordinates found for destination: {original_destination}")
        return None

    def get_available_ports_sample(self) -> List[str]:
        """Get a sample of available ports for error messages"""
        return list(self.fallback_ports.keys())[:10]

# Global port service instance
_port_service = None

def get_port_service() -> PortService:
    """Get the global port service instance"""
    global _port_service
    if _port_service is None:
        _port_service = PortService()
    return _port_service

# Async wrapper for compatibility
async def find_port_coordinates(destination_name: str) -> Optional[Tuple[float, float]]:
    """Find port coordinates using the global port service"""
    service = get_port_service()
    return await service.find_port_coordinates(destination_name)