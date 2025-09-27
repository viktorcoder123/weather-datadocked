# API Setup Guide

## Important Note About CORS

When testing this application locally, you may encounter CORS (Cross-Origin Resource Sharing) errors when calling external APIs directly from the browser. This is expected behavior for security reasons.

## Solutions for CORS Issues:

### 1. Use a CORS Proxy (Recommended for Development)
Add these proxy URLs before your API endpoints:
- `https://cors-anywhere.herokuapp.com/` (may require demo access)
- `https://api.allorigins.win/raw?url=`

### 2. Configure API Keys

The app now handles API failures gracefully by providing mock data when APIs are unavailable.

## DataDocked API

**Note**: The actual DataDocked API endpoint URL needs to be verified. The current placeholder is:
- `https://api.datadocked.com/v1/vessels/search`

Please check DataDocked's documentation for:
1. Correct API endpoint URL
2. Authentication method (Bearer token, API key in header, or query parameter)
3. Request format

To update the endpoint, modify `/src/services/apiService.ts` line 27.

## Weather APIs

### StormGlass
- Endpoint: `https://api.stormglass.io/v2/weather/point`
- Get your API key from: https://stormglass.io

### WeatherAPI
- Endpoint: `https://api.weatherapi.com/v1/forecast.json`
- Get your API key from: https://www.weatherapi.com

### Windy
- Endpoint: `https://api.windy.com/api/point-forecast/v2`
- Get your API key from: https://api.windy.com

## Testing Without Real APIs

The application automatically falls back to mock data when:
1. API keys are not configured
2. APIs return errors (CORS, network, etc.)
3. API endpoints are unavailable

This allows you to test the application's functionality even without valid API keys.

## For Production

For production deployment, you should:
1. Set up a backend server to proxy API requests
2. Store API keys securely on the server
3. Implement proper authentication
4. Handle API rate limiting

## Troubleshooting

If you see "Failed to fetch" errors in the console:
- This is likely due to CORS restrictions
- The app will automatically use mock data
- Check the browser console for specific error messages
- Verify your API keys are correct
- Check if the API services are operational