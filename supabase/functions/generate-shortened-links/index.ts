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

// Função para testar se a API Key do Short.io está funcionando
async function testShortIoApiKey(): Promise<boolean> {
  const shortIoApiKey = Deno.env.get('SHORT_IO_API_KEY');
  
  if (!shortIoApiKey) {
    console.error('SHORT_IO_API_KEY não configurada');
    return false;
  }

  try {
    console.log('Testando API Key do Short.io...');
    // Testar criando um link temporário para validar a API key
    const response = await fetch('https://api.short.io/api/links', {
      method: 'POST',
      headers: {
        'Authorization': shortIoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalURL: 'https://google.com',
        allowDuplicates: true
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('API Key válida. Link de teste criado:', result.shortURL);
      return true;
    } else {
      const errorText = await response.text();
      console.error('API Key inválida:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Erro ao testar API Key:', error);
    return false;
  }
}

// Função para criar URL encurtada no Short.io
async function createShortUrl(originalUrl: string, userId: string): Promise<string> {
  const shortIoApiKey = Deno.env.get('SHORT_IO_API_KEY');
  
  if (!shortIoApiKey) {
    console.error('SHORT_IO_API_KEY não configurada');
    throw new Error('SHORT_IO_API_KEY não configurada');
  }

  console.log(`Criando URL encurtada para usuário ${userId}:`, originalUrl);
  
  // Criar URL única adicionando parâmetro do usuário
  const trackingUrl = `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}utm_source=zapmeter&utm_user=${userId}`;
  
  try {
    console.log('Criando link no Short.io...');
    
    // Primeiro tentar sem domínio customizado
    let response = await fetch('https://api.short.io/api/links', {
      method: 'POST',
      headers: {
        'Authorization': shortIoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalURL: trackingUrl,
        allowDuplicates: true
      })
    });

    console.log('Status da resposta Short.io (sem domínio):', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Link criado com sucesso:', result.shortURL);
      return result.shortURL;
    }

    // Se não funcionou sem domínio, tentar com domínio específico
    console.log('Tentando com domínio zapmeter.app...');
    response = await fetch('https://api.short.io/api/links', {
      method: 'POST',
      headers: {
        'Authorization': shortIoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalURL: trackingUrl,
        allowDuplicates: true,
        domain: 'zapmeter.app'
      })
    });

    console.log('Status da resposta Short.io (com domínio):', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Link criado com sucesso com domínio:', result.shortURL);
      return result.shortURL;
    } else {
      const errorText = await response.text();
      console.error('Erro na API Short.io:', response.status, errorText);
      throw new Error(`Erro na API Short.io: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Erro ao criar URL encurtada:', error);
    throw new Error(`Falha ao criar link encurtado: ${error.message}`);
  }
}

serve(async (req) => {
  // Lidar com requisições CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== INICIANDO GERAÇÃO DE LINKS ENCURTADOS ===');
    
    // Primeiro testar se a API Key do Short.io está funcionando
    const isApiKeyValid = await testShortIoApiKey();
    if (!isApiKeyValid) {
      return new Response(
        JSON.stringify({ 
          error: 'API Key do Short.io inválida ou não configurada',
          details: 'Verifique a configuração da chave SHORT_IO_API_KEY'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const { campaign_post_id, post_url }: GenerateLinksRequest = await req.json();
    
    if (!campaign_post_id || !post_url) {
      console.error('Parâmetros obrigatórios não fornecidos');
      return new Response(
        JSON.stringify({ error: 'campaign_post_id e post_url são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('Processando post:', campaign_post_id, 'com URL:', post_url);

    // 1. Verificar se existe domínio ativo
    console.log('1. Verificando domínio ativo...');
    const { data: activeDomain, error: domainError } = await supabase
      .from('admin_domains')
      .select('*')
      .eq('is_active', true)
      .single();

    if (domainError || !activeDomain) {
      console.error('Nenhum domínio ativo encontrado:', domainError);
      return new Response(
        JSON.stringify({ error: 'Nenhum domínio ativo configurado' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log('Domínio ativo encontrado:', activeDomain.domain);

    // 2. Buscar dados da campanha
    console.log('2. Buscando dados da campanha...');
    const { data: postData, error: postError } = await supabase
      .from('campaign_posts')
      .select('campaign_id')
      .eq('id', campaign_post_id)
      .single();

    if (postError || !postData) {
      console.error('Erro ao buscar post:', postError);
      return new Response(
        JSON.stringify({ error: 'Post não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Campanha encontrada:', postData.campaign_id);

    // 3. Buscar interesses da campanha
    console.log('3. Buscando interesses da campanha...');
    const { data: campaignInterests, error: interestsError } = await supabase
      .from('campaign_interests')
      .select('interest_id')
      .eq('campaign_id', postData.campaign_id);

    if (interestsError) {
      console.error('Erro ao buscar interesses da campanha:', interestsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar interesses da campanha' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const interestIds = campaignInterests?.map(ci => ci.interest_id) || [];
    console.log('Interesses encontrados:', interestIds.length);

    if (interestIds.length === 0) {
      console.log('Nenhum interesse associado à campanha');
      return new Response(
        JSON.stringify({ 
          success: true,
          links_created: 0,
          message: 'Nenhum interesse associado à campanha'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Buscar usuários com interesses correspondentes
    console.log('4. Buscando usuários com interesses correspondentes...');
    const { data: userInterests, error: userInterestsError } = await supabase
      .from('user_interests')
      .select('user_id')
      .in('interest_id', interestIds);

    if (userInterestsError) {
      console.error('Erro ao buscar interesses dos usuários:', userInterestsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar usuários interessados' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Remover usuários duplicados
    const uniqueUserIds = [...new Set(userInterests?.map(ui => ui.user_id) || [])];
    console.log('Usuários únicos encontrados:', uniqueUserIds.length);

    if (uniqueUserIds.length === 0) {
      console.log('Nenhum usuário com interesses correspondentes');
      return new Response(
        JSON.stringify({ 
          success: true,
          links_created: 0,
          message: 'Nenhum usuário com interesses correspondentes'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Buscar perfis dos usuários
    console.log('5. Buscando perfis dos usuários...');
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, whatsapp_phone, first_name, last_name')
      .in('user_id', uniqueUserIds);

    if (profilesError) {
      console.error('Erro ao buscar perfis dos usuários:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar perfis dos usuários' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Perfis encontrados:', userProfiles?.length || 0);

    // 6. Gerar links encurtados para cada usuário
    console.log('6. Gerando links encurtados...');
    const createdLinks = [];
    let successCount = 0;
    let errorCount = 0;

    for (const profile of userProfiles || []) {
      try {
        console.log(`Processando usuário: ${profile.user_id}`);

        // Verificar se já existe link para este usuário e post
        const { data: existingLink } = await supabase
          .from('shortened_links')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('campaign_post_id', campaign_post_id)
          .maybeSingle();

        if (existingLink) {
          console.log(`Link já existe para usuário ${profile.user_id}`);
          createdLinks.push(existingLink);
          successCount++;
          continue;
        }

        // Criar URL encurtada no Short.io
        const shortenedUrl = await createShortUrl(post_url, profile.user_id);
        
        // Extrair código curto da URL
        const shortCode = shortenedUrl.split('/').pop() || '';

        // Salvar no banco de dados
        const { data: newLink, error: linkError } = await supabase
          .from('shortened_links')
          .insert({
            user_id: profile.user_id,
            campaign_post_id,
            domain_id: activeDomain.id,
            short_code: shortCode,
            original_url: post_url,
            shortened_url: shortenedUrl,
          })
          .select()
          .single();

        if (linkError) {
          console.error(`Erro ao salvar link para usuário ${profile.user_id}:`, linkError);
          errorCount++;
          continue;
        }

        createdLinks.push(newLink);
        successCount++;
        console.log(`Link criado com sucesso para usuário ${profile.user_id}:`, shortenedUrl);

        // Enviar mensagem WhatsApp (se configurado)
        const botconversaApiKey = Deno.env.get('BOTCONVERSA_API_KEY');
        
        if (botconversaApiKey && profile.whatsapp_phone) {
          try {
            console.log(`Enviando WhatsApp para ${profile.whatsapp_phone}`);
            
            const message = `🚀 *Novo material disponível!*

📋 Olá ${profile.first_name}! Temos novo conteúdo para você:

🔗 Seu link personalizado:
${shortenedUrl}

ℹ️ *Instruções:*
• Clique no link para visualizar o conteúdo
• O link é exclusivo e rastreável
• Compartilhe apenas se autorizado

📊 Seus cliques serão contabilizados para métricas`;

            const whatsappResponse = await fetch('https://api.botconversa.com.br/api/v1/webhook-send-message', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${botconversaApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phone: profile.whatsapp_phone,
                message: message,
              }),
            });

            if (whatsappResponse.ok) {
              console.log(`Mensagem WhatsApp enviada com sucesso para ${profile.whatsapp_phone}`);
            } else {
              const errorData = await whatsappResponse.text();
              console.error(`Falha ao enviar WhatsApp para ${profile.whatsapp_phone}:`, errorData);
            }
          } catch (whatsappError) {
            console.error(`Erro ao enviar WhatsApp para ${profile.whatsapp_phone}:`, whatsappError);
          }
        } else {
          console.log(`Pulando WhatsApp para usuário ${profile.user_id} - API key ou telefone ausentes`);
        }
        
      } catch (error) {
        console.error(`Erro ao processar usuário ${profile.user_id}:`, error);
        errorCount++;
      }
    }

    console.log(`=== RESULTADO: ${successCount} links criados, ${errorCount} erros ===`);

    return new Response(
      JSON.stringify({
        success: true,
        links_created: successCount,
        errors: errorCount,
        total_users: userProfiles?.length || 0,
        domain: activeDomain.domain,
        links: createdLinks,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('=== ERRO GERAL NA FUNÇÃO ===:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});