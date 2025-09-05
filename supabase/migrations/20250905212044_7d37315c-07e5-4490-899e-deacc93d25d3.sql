-- Create table for WhatsApp referral links
CREATE TABLE public.whatsapp_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  whatsapp_link TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own WhatsApp links" 
ON public.whatsapp_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp links" 
ON public.whatsapp_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp links" 
ON public.whatsapp_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp links" 
ON public.whatsapp_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_whatsapp_links_updated_at
BEFORE UPDATE ON public.whatsapp_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();