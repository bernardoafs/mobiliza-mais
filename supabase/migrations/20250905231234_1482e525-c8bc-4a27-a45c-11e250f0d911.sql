-- Create table for admin domains
CREATE TABLE public.admin_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for admin domains
ALTER TABLE public.admin_domains ENABLE ROW LEVEL SECURITY;

-- Create policies for admin domains
CREATE POLICY "Admin can view domains" 
ON public.admin_domains 
FOR SELECT 
USING (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

CREATE POLICY "Admin can create domains" 
ON public.admin_domains 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

CREATE POLICY "Admin can update domains" 
ON public.admin_domains 
FOR UPDATE 
USING (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

CREATE POLICY "Admin can delete domains" 
ON public.admin_domains 
FOR DELETE 
USING (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

-- Create table for shortened links
CREATE TABLE public.shortened_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_post_id UUID NOT NULL REFERENCES public.campaign_posts(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.admin_domains(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL,
  original_url TEXT NOT NULL,
  shortened_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_post_id),
  UNIQUE(domain_id, short_code)
);

-- Enable RLS for shortened links
ALTER TABLE public.shortened_links ENABLE ROW LEVEL SECURITY;

-- Create policies for shortened links
CREATE POLICY "Users can view their own shortened links" 
ON public.shortened_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all shortened links" 
ON public.shortened_links 
FOR SELECT 
USING (auth.jwt() ->> 'email' = 'bernardoafs@gmail.com');

CREATE POLICY "System can create shortened links" 
ON public.shortened_links 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update shortened links" 
ON public.shortened_links 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_domains_updated_at
BEFORE UPDATE ON public.admin_domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shortened_links_updated_at
BEFORE UPDATE ON public.shortened_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();