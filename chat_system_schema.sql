-- Chat System Database Schema
-- Run this in your Supabase SQL Editor to set up the chat system

-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tasker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(task_id, customer_id, tasker_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Chat participants table for group chats (future expansion)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(chat_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats table
CREATE POLICY "Users can view chats they participate in" ON public.chats
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = tasker_id);

CREATE POLICY "Users can create chats for tasks they're involved in" ON public.chats
  FOR INSERT WITH CHECK (
    (auth.uid() = customer_id AND EXISTS (
      SELECT 1 FROM public.tasks WHERE id = task_id AND customer_id = auth.uid()
    )) OR
    (auth.uid() = tasker_id AND EXISTS (
      SELECT 1 FROM public.task_applications WHERE task_id = task_id AND tasker_id = auth.uid()
    ))
  );

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view messages in chats they participate in" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_id AND (customer_id = auth.uid() OR tasker_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in chats they participate in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_id AND (customer_id = auth.uid() OR tasker_id = auth.uid())
    ) AND sender_id = auth.uid()
  );

-- RLS Policies for chat_participants table
CREATE POLICY "Users can view participants in chats they participate in" ON public.chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats 
      WHERE id = chat_id AND (customer_id = auth.uid() OR tasker_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_task_id ON public.chats(task_id);
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON public.chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_tasker_id ON public.chats(tasker_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON public.chats(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);

-- Insert initial chat participants when chat is created
CREATE OR REPLACE FUNCTION insert_chat_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_participants (chat_id, user_id) VALUES (NEW.id, NEW.customer_id);
  INSERT INTO public.chat_participants (chat_id, user_id) VALUES (NEW.id, NEW.tasker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_chat_participants
  AFTER INSERT ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION insert_chat_participants();

-- Update last_message_at when new message is inserted
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats 
  SET last_message_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_last_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_last_message();
