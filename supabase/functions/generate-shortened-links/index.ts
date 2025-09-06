import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateLinksRequest {
  campaign_post_id: string;
  post_url: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Function to create a shortened URL using Short.io API
async function createShortUrl(originalUrl: string): Promise<string> {
  const shortIoApiKey = Deno.env.get('SHORT_IO_API_KEY');
  
  if (!shortIoApiKey) {
    throw new Error('SHORT_IO_API_KEY not configured');
  }

  console.log('Creating short URL for:', originalUrl);
  console.log('API Key present:', !!shortIoApiKey);

  // Try multiple authentication methods and domain configurations
  const authMethods = [
    {
      name: 'Bearer token with default domain',
      headers: {
        'Authorization': `Bearer ${shortIoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        originalURL: originalUrl,
        allowDuplicates: false
      }
    },
    {
      name: 'Direct API key with default domain',
      headers: {
        'Authorization': shortIoApiKey,
        'Content-Type': 'application/json',
      },
      body: {
        originalURL: originalUrl,
        allowDuplicates: false
      }
    },
    {
      name: 'Bearer token with custom domain',
      headers: {
        'Authorization': `Bearer ${shortIoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        originalURL: originalUrl,
        domain: 'zapmeter.app',
        allowDuplicates: false
      }
    },
    {
      name: 'Direct API key with custom domain',
      headers: {
        'Authorization': shortIoApiKey,
        'Content-Type': 'application/json',
      },
      body: {
        originalURL: originalUrl,
        domain: 'zapmeter.app',
        allowDuplicates: false
      }
    }
  ];

  for (const method of authMethods) {
    try {
      console.log(`Trying ${method.name}...`);
      
      const response = await fetch('https://api.short.io/links', {
        method: 'POST',
        headers: method.headers,
        body: JSON.stringify(method.body)
      });

      console.log(`${method.name} response status:`, response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Successfully created short URL with ${method.name}:`, result.shortURL);
        return result.shortURL;
      } else {
        const errorText = await response.text();
        console.log(`${method.name} failed:`, response.status, errorText);
      }
    } catch (error) {
      console.log(`${method.name} error:`, error.message);
    }
  }

  throw new Error('All Short.io authentication methods failed. Please check your API key and domain configuration.');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_post_id, post_url }: GenerateLinksRequest = await req.json();
    
    console.log('Generating shortened links for post:', campaign_post_id);

    // Get active domain
    const { data: activeDomain, error: domainError } = await supabase
      .from('admin_domains')
      .select('*')
      .eq('is_active', true)
      .single();

    if (domainError || !activeDomain) {
      console.error('No active domain found:', domainError);
      return new Response(
        JSON.stringify({ error: 'No active domain configured' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get campaign_id first
    const { data: postData, error: postError } = await supabase
      .from('campaign_posts')
      .select('campaign_id')
      .eq('id', campaign_post_id)
      .single();

    if (postError || !postData) {
      console.error('Error fetching post:', postError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch post data' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get campaign interests
    const { data: campaignInterests, error: interestsError } = await supabase
      .from('campaign_interests')
      .select('interest_id')
      .eq('campaign_id', postData.campaign_id);

    if (interestsError) {
      console.error('Error fetching campaign interests:', interestsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch campaign interests' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const interestIds = campaignInterests?.map(ci => ci.interest_id) || [];

    if (interestIds.length === 0) {
      console.log('No interests associated with this campaign');
      return new Response(
        JSON.stringify({ 
          success: true,
          links_created: 0,
          message: 'No users to notify - campaign has no associated interests'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get users who have interests matching the campaign
    const { data: userInterests, error: userInterestsError } = await supabase
      .from('user_interests')
      .select('user_id')
      .in('interest_id', interestIds);

    if (userInterestsError) {
      console.error('Error fetching user interests:', userInterestsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user interests' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userIds = [...new Set(userInterests?.map(ui => ui.user_id) || [])];

    if (userIds.length === 0) {
      console.log('No users with matching interests');
      return new Response(
        JSON.stringify({ 
          success: true,
          links_created: 0,
          message: 'No users have interests matching this campaign'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get profiles for users with matching interests
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, whatsapp_phone')
      .in('user_id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Creating shortened links for ${users?.length || 0} users`);

    const createdLinks = [];

    // Generate shortened link for each user
    for (const user of users || []) {
      try {
        // Check if link already exists for this user and post
        const { data: existingLink } = await supabase
          .from('shortened_links')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('campaign_post_id', campaign_post_id)
          .single();

        if (existingLink) {
          console.log(`Link already exists for user ${user.user_id}`);
          createdLinks.push(existingLink);
          continue;
        }

        // Create shortened URL using Short.io API
        const shortenedUrl = await createShortUrl(post_url);
        
        // Extract short code from the shortened URL
        const shortCode = shortenedUrl.split('/').pop() || '';

        // Create shortened link
        const { data: newLink, error: linkError } = await supabase
          .from('shortened_links')
          .insert({
            user_id: user.user_id,
            campaign_post_id,
            domain_id: activeDomain.id,
            short_code: shortCode,
            original_url: post_url,
            shortened_url: shortenedUrl,
          })
          .select()
          .single();

        if (linkError) {
          console.error('Error creating link for user:', user.user_id, linkError);
          continue;
        }

        createdLinks.push(newLink);

        // Send WhatsApp message via botconversa API
        const botconversaApiKey = Deno.env.get('BOTCONVERSA_API_KEY');
        
        if (botconversaApiKey && user.whatsapp_phone) {
          try {
            const message = `🚀 *Novo material disponível!*

📋 Acesse o link personalizado:
${shortenedUrl}

ℹ️ *Instruções:*
• Clique no link para visualizar o conteúdo
• O link é exclusivo e rastreável
• Compartilhe apenas se autorizado

📊 Seus cliques serão contabilizados para métricas`;

            const botconversaResponse = await fetch('https://api.botconversa.com.br/api/v1/webhook-send-message', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${botconversaApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone: user.whatsapp_phone,
                message: message,
              }),
            });

            if (botconversaResponse.ok) {
              console.log(`Message sent successfully to ${user.whatsapp_phone}`);
            } else {
              const errorData = await botconversaResponse.text();
              console.error(`Failed to send message to ${user.whatsapp_phone}:`, errorData);
            }
          } catch (error) {
            console.error(`Error sending message to ${user.whatsapp_phone}:`, error);
          }
        } else {
          console.log(`Skipping message for user ${user.user_id} - missing API key or phone`);
        }
        
      } catch (error) {
        console.error('Error processing user:', user.user_id, error);
      }
    }

    console.log(`Successfully created ${createdLinks.length} shortened links`);

    return new Response(
      JSON.stringify({
        success: true,
        links_created: createdLinks.length,
        domain: activeDomain.domain,
        links: createdLinks,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-shortened-links function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});