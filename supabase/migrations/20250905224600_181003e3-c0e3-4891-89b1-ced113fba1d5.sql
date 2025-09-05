-- Fix the RLS policy for campaign_posts to allow admin to insert
DROP POLICY "Only admins can create campaign posts" ON public.campaign_posts;

CREATE POLICY "Admin can create campaign posts" 
ON public.campaign_posts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE users.id = auth.uid() 
    AND users.email = 'bernardoafs@gmail.com'
  )
);

-- Also fix the other policies to use the same admin check pattern
DROP POLICY "Only admins can update campaign posts" ON public.campaign_posts;
DROP POLICY "Only admins can delete campaign posts" ON public.campaign_posts;

CREATE POLICY "Admin can update campaign posts" 
ON public.campaign_posts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE users.id = auth.uid() 
    AND users.email = 'bernardoafs@gmail.com'
  )
);

CREATE POLICY "Admin can delete campaign posts" 
ON public.campaign_posts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1
    FROM auth.users
    WHERE users.id = auth.uid() 
    AND users.email = 'bernardoafs@gmail.com'
  )
);