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

// Generate alphanumeric code
function generateShortCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check if code is unique
async function generateUniqueShortCode(domainId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateShortCode();
    
    const { data: existing } = await supabase
      .from('shortened_links')
      .select('id')
      .eq('domain_id', domainId)
      .eq('short_code', code)
      .single();
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique short code');
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

    // Get campaign interests first
    const { data: campaignInterests, error: interestsError } = await supabase
      .from('campaign_interests')
      .select('interest_id')
      .eq('campaign_id', (await supabase
        .from('campaign_posts')
        .select('campaign_id')
        .eq('id', campaign_post_id)
        .single()
      ).data?.campaign_id);

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

    // Get users with profiles who have at least one interest matching the campaign
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id, 
        whatsapp_phone,
        user_interests!inner(interest_id)
      `)
      .in('user_interests.interest_id', interestIds);

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

        const shortCode = await generateUniqueShortCode(activeDomain.id);
        const shortenedUrl = `https://${activeDomain.domain}/${shortCode}`;

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

            const botconversaResponse = await fetch('https://api.botconversa.com.br/api/v1/webhook-message', {
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