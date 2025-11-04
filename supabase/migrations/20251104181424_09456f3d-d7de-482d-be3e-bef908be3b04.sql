-- Add gender and looking_for fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS looking_for text;

-- Add check constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_gender_check 
CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_looking_for_check 
CHECK (looking_for IS NULL OR looking_for IN ('team_members', 'teams', 'both'));