-- Create campaigns table (basic campaign info)
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_posts table (links for each campaign)
CREATE TABLE public.campaign_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('instagram', 'tiktok', 'whatsapp')),
  post_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_interests table (many-to-many relationship)
CREATE TABLE public.campaign_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.personal_interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, interest_id)
);

-- Update whatsapp_links table to reference campaigns
ALTER TABLE public.whatsapp_links 
DROP COLUMN campaign_name,
ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id);

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_interests ENABLE ROW LEVEL SECURITY;

-- Campaigns policies (only admins can manage campaigns, everyone can view)
CREATE POLICY "Everyone can view campaigns" 
ON public.campaigns 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can create campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (false); -- Will be updated when admin role is implemented

CREATE POLICY "Only admins can update campaigns" 
ON public.campaigns 
FOR UPDATE 
USING (false); -- Will be updated when admin role is implemented

CREATE POLICY "Only admins can delete campaigns" 
ON public.campaigns 
FOR DELETE 
USING (false); -- Will be updated when admin role is implemented

-- Campaign posts policies
CREATE POLICY "Everyone can view campaign posts" 
ON public.campaign_posts 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can create campaign posts" 
ON public.campaign_posts 
FOR INSERT 
WITH CHECK (false); -- Will be updated when admin role is implemented

CREATE POLICY "Only admins can update campaign posts" 
ON public.campaign_posts 
FOR UPDATE 
USING (false); -- Will be updated when admin role is implemented

CREATE POLICY "Only admins can delete campaign posts" 
ON public.campaign_posts 
FOR DELETE 
USING (false); -- Will be updated when admin role is implemented

-- Campaign interests policies
CREATE POLICY "Everyone can view campaign interests" 
ON public.campaign_interests 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can create campaign interests" 
ON public.campaign_interests 
FOR INSERT 
WITH CHECK (false); -- Will be updated when admin role is implemented

CREATE POLICY "Only admins can update campaign interests" 
ON public.campaign_interests 
FOR UPDATE 
USING (false); -- Will be updated when admin role is implemented

CREATE POLICY "Only admins can delete campaign interests" 
ON public.campaign_interests 
FOR DELETE 
USING (false); -- Will be updated when admin role is implemented

-- Add triggers for timestamp updates
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_posts_updated_at
BEFORE UPDATE ON public.campaign_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_campaign_posts_campaign_id ON public.campaign_posts(campaign_id);
CREATE INDEX idx_campaign_interests_campaign_id ON public.campaign_interests(campaign_id);
CREATE INDEX idx_campaign_interests_interest_id ON public.campaign_interests(interest_id);
CREATE INDEX idx_whatsapp_links_campaign_id ON public.whatsapp_links(campaign_id);