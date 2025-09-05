-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  voting_state TEXT NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  instagram_user TEXT NOT NULL,
  tiktok_user TEXT NOT NULL,
  was_candidate BOOLEAN DEFAULT FALSE,
  will_be_candidate BOOLEAN DEFAULT FALSE,
  political_party TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personal interests table
CREATE TABLE public.personal_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user interests relationship table
CREATE TABLE public.user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.personal_interests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, interest_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for personal interests (readable by all authenticated users)
CREATE POLICY "Authenticated users can view interests" 
ON public.personal_interests 
FOR SELECT 
TO authenticated
USING (true);

-- Create policies for user interests
CREATE POLICY "Users can view their own interests" 
ON public.user_interests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interests" 
ON public.user_interests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests" 
ON public.user_interests 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" 
ON public.user_interests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_interests_updated_at
  BEFORE UPDATE ON public.personal_interests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Profile will be created separately through the registration form
  RETURN new;
END;
$$;

-- Insert some default personal interests
INSERT INTO public.personal_interests (name, description) VALUES
  ('Educação', 'Interesse em políticas e projetos educacionais'),
  ('Saúde', 'Interesse em políticas e projetos de saúde pública'),
  ('Meio Ambiente', 'Interesse em sustentabilidade e preservação ambiental'),
  ('Segurança Pública', 'Interesse em políticas de segurança e ordem pública'),
  ('Economia', 'Interesse em desenvolvimento econômico e empreendedorismo'),
  ('Cultura', 'Interesse em arte, cultura e patrimônio histórico'),
  ('Esporte', 'Interesse em políticas públicas para esporte e lazer'),
  ('Tecnologia', 'Interesse em inovação e transformação digital'),
  ('Direitos Humanos', 'Interesse em igualdade e justiça social'),
  ('Infraestrutura', 'Interesse em obras públicas e desenvolvimento urbano');