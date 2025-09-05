-- Drop the problematic function and create a simpler approach
DROP FUNCTION IF EXISTS public.is_admin();

-- Update campaign_posts policies to directly check the user email in JWT
DROP POLICY IF EXISTS "Admin can create campaign posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Admin can update campaign posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Admin can delete campaign posts" ON public.campaign_posts;

CREATE POLICY "Admin can create campaign posts" 
ON public.campaign_posts 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

CREATE POLICY "Admin can update campaign posts" 
ON public.campaign_posts 
FOR UPDATE 
USING (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

CREATE POLICY "Admin can delete campaign posts" 
ON public.campaign_posts 
FOR DELETE 
USING (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');