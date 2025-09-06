import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    const shortIoApiKey = Deno.env.get('SHORT_IO_API_KEY');
    
    console.log('Testing Short.io API without domain...');
    console.log('API Key present:', !!shortIoApiKey);
    console.log('API Key value:', shortIoApiKey?.substring(0, 10) + '...');
    console.log('URL to shorten:', url);

    if (!shortIoApiKey) {
      return new Response(
        JSON.stringify({ error: 'SHORT_IO_API_KEY not configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // First, let's try to get domains list to see what's available
    const domainsResponse = await fetch('https://api.short.io/domains', {
      method: 'GET',
      headers: {
        'Authorization': shortIoApiKey,
        'accept': 'application/json',
      },
    });

    console.log('Domains response status:', domainsResponse.status);
    
    const domainsText = await domainsResponse.text();
    console.log('Domains response:', domainsText);

    // Now try to create a link without specifying domain
    const response = await fetch('https://api.short.io/links', {
      method: 'POST',
      headers: {
        'Authorization': shortIoApiKey,
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        allowDuplicates: false,
        originalURL: url
        // No domain specified - should use default
      })
    });

    console.log('Short.io response status:', response.status);
    
    const responseText = await response.text();
    console.log('Short.io response:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Short.io API error',
          status: response.status,
          response: responseText,
          domainsResponse: domainsText
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = JSON.parse(responseText);
    
    return new Response(
      JSON.stringify({
        success: true,
        shortUrl: result.shortURL,
        fullResponse: result,
        availableDomains: domainsText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});