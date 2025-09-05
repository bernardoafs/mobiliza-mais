-- Add RLS policies for personal_interests table to allow admin operations
-- Only the admin user (bernardoafs@gmail.com) can manage interests

-- Policy to allow admin to insert interests
CREATE POLICY "Admin can insert interests" 
ON public.personal_interests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'bernardoafs@gmail.com'
  )
);

-- Policy to allow admin to update interests
CREATE POLICY "Admin can update interests" 
ON public.personal_interests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'bernardoafs@gmail.com'
  )
);

-- Policy to allow admin to delete interests
CREATE POLICY "Admin can delete interests" 
ON public.personal_interests 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'bernardoafs@gmail.com'
  )
);