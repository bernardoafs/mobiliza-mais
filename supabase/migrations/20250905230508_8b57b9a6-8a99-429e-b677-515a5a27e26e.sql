-- Update the check constraint to allow the values being used in the frontend
ALTER TABLE public.campaign_posts 
DROP CONSTRAINT campaign_posts_post_type_check;

-- Add new constraint with the values the frontend is using
ALTER TABLE public.campaign_posts 
ADD CONSTRAINT campaign_posts_post_type_check 
CHECK (post_type = ANY (ARRAY['instagram'::text, 'tiktok'::text, 'whatsapp'::text, 'link'::text, 'imagem'::text, 'documento'::text, 'video'::text]));