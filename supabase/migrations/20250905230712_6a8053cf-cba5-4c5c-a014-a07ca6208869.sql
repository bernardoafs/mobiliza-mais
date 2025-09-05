-- Update the check constraint to allow only instagram, tiktok and link
ALTER TABLE public.campaign_posts 
DROP CONSTRAINT campaign_posts_post_type_check;

-- Add new constraint with only the 3 required values
ALTER TABLE public.campaign_posts 
ADD CONSTRAINT campaign_posts_post_type_check 
CHECK (post_type = ANY (ARRAY['instagram'::text, 'tiktok'::text, 'link'::text]));