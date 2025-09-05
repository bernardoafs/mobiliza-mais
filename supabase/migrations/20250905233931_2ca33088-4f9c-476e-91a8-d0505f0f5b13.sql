-- Corrigir políticas RLS da tabela campaigns para permitir que admins criem campanhas
DROP POLICY IF EXISTS "Only admins can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Only admins can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Only admins can delete campaigns" ON campaigns;

-- Criar políticas corretas para admins
CREATE POLICY "Admin can create campaigns" 
ON campaigns 
FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'bernardoafs@gmail.com'::text);

CREATE POLICY "Admin can update campaigns" 
ON campaigns 
FOR UPDATE 
USING ((auth.jwt() ->> 'email'::text) = 'bernardoafs@gmail.com'::text);

CREATE POLICY "Admin can delete campaigns" 
ON campaigns 
FOR DELETE 
USING ((auth.jwt() ->> 'email'::text) = 'bernardoafs@gmail.com'::text);

-- Corrigir políticas RLS da tabela campaign_interests para permitir que admins gerenciem interesses
DROP POLICY IF EXISTS "Only admins can create campaign interests" ON campaign_interests;
DROP POLICY IF EXISTS "Only admins can update campaign interests" ON campaign_interests;
DROP POLICY IF EXISTS "Only admins can delete campaign interests" ON campaign_interests;

-- Criar políticas corretas para campaign_interests
CREATE POLICY "Admin can create campaign interests" 
ON campaign_interests 
FOR INSERT 
WITH CHECK ((auth.jwt() ->> 'email'::text) = 'bernardoafs@gmail.com'::text);

CREATE POLICY "Admin can update campaign interests" 
ON campaign_interests 
FOR UPDATE 
USING ((auth.jwt() ->> 'email'::text) = 'bernardoafs@gmail.com'::text);

CREATE POLICY "Admin can delete campaign interests" 
ON campaign_interests 
FOR DELETE 
USING ((auth.jwt() ->> 'email'::text) = 'bernardoafs@gmail.com'::text);