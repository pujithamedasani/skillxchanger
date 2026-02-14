
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  department TEXT DEFAULT '',
  year_of_study TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  campus_location TEXT DEFAULT '',
  skills_teach TEXT[] DEFAULT '{}',
  skills_learn TEXT[] DEFAULT '{}',
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create connection status enum
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create connections table with compound unique index
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status public.connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT connections_no_self CHECK (requester_id != receiver_id),
  CONSTRAINT connections_unique_pair UNIQUE (requester_id, receiver_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.connections(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Helper function: get profile id from auth uid
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Helper function: check connection membership
CREATE OR REPLACE FUNCTION public.is_connection_member(_connection_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE id = _connection_id
    AND (requester_id = public.get_profile_id() OR receiver_id = public.get_profile_id())
  );
$$;

-- Helper function: check accepted connection
CREATE OR REPLACE FUNCTION public.is_accepted_connection(_connection_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE id = _connection_id AND status = 'accepted'
  );
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Anyone authenticated can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for connections
CREATE POLICY "Users can view own connections"
ON public.connections FOR SELECT
TO authenticated
USING (requester_id = public.get_profile_id() OR receiver_id = public.get_profile_id());

CREATE POLICY "Users can create connections"
ON public.connections FOR INSERT
TO authenticated
WITH CHECK (requester_id = public.get_profile_id() AND requester_id != receiver_id);

CREATE POLICY "Receiver can update connection status"
ON public.connections FOR UPDATE
TO authenticated
USING (receiver_id = public.get_profile_id());

CREATE POLICY "Users can delete own connections"
ON public.connections FOR DELETE
TO authenticated
USING (requester_id = public.get_profile_id() OR receiver_id = public.get_profile_id());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their connections"
ON public.messages FOR SELECT
TO authenticated
USING (
  public.is_connection_member(connection_id)
  AND public.is_accepted_connection(connection_id)
);

CREATE POLICY "Users can send messages in accepted connections"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = public.get_profile_id()
  AND public.is_connection_member(connection_id)
  AND public.is_accepted_connection(connection_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_skills_teach ON public.profiles USING GIN(skills_teach);
CREATE INDEX idx_profiles_skills_learn ON public.profiles USING GIN(skills_learn);
CREATE INDEX idx_connections_requester ON public.connections(requester_id);
CREATE INDEX idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX idx_connections_status ON public.connections(status);
CREATE INDEX idx_messages_connection ON public.messages(connection_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
