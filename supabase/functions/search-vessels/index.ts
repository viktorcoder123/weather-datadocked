import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get DataDocked API key from user's stored secrets
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('datadocked_api_key')
      .single();

    if (apiKeyError || !apiKeyData?.datadocked_api_key) {
      return new Response(JSON.stringify({ error: 'DataDocked API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Searching for vessel:', query);
    
    // Call DataDocked API
    const response = await fetch(
      `https://datadocked.com/api/vessels_operations/get-vessel-location?api_key=${apiKeyData.datadocked_api_key}&imo_or_mmsi=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`DataDocked API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.detail) {
      const vessel = {
        id: data.detail.imo || data.detail.mmsi,
        name: data.detail.name,
        imo: data.detail.imo,
        mmsi: data.detail.mmsi,
        type: 'Maritime Vessel', // DataDocked doesn't provide type in this endpoint
        latitude: parseFloat(data.detail.latitude),
        longitude: parseFloat(data.detail.longitude),
        speed: parseFloat(data.detail.speed?.replace(' kn', '') || '0'),
        course: parseFloat(data.detail.course?.replace('°', '') || '0'),
        status: data.detail.navigationalStatus || 'Unknown',
        lastUpdate: data.detail.updateTime,
        destination: data.detail.destination,
        lastPort: data.detail.lastPort,
        eta: data.detail.etaUtc,
        atd: data.detail.atdUtc,
        callsign: data.detail.callsign,
        draught: data.detail.draught
      };

      return new Response(JSON.stringify({ vessels: [vessel] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ vessels: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in search-vessels function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});