-- Let's create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'bernardoafs@gmail.com'
  );
$$;

-- Update campaign_posts policies to use the function
DROP POLICY IF EXISTS "Admin can create campaign posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Admin can update campaign posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Admin can delete campaign posts" ON public.campaign_posts;

CREATE POLICY "Admin can create campaign posts" 
ON public.campaign_posts 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update campaign posts" 
ON public.campaign_posts 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admin can delete campaign posts" 
ON public.campaign_posts 
FOR DELETE 
USING (public.is_admin());