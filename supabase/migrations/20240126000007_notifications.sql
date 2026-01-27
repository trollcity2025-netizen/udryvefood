-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text,
    type text DEFAULT 'info', -- info, success, warning, error
    link text, -- optional URL to redirect to
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Only system/functions should insert notifications usually, but for now allow users to insert (optional, maybe restrict later)
-- For now, let's allow authenticated users to insert if needed (e.g. testing) or restrict to service role.
-- Actually, notifications are usually system generated. Let's rely on server-side or triggers.
-- But to be safe, we can allow admins or service role.
-- For simplicity in this demo, we'll leave insert policy restricted to service_role (default deny public) unless we need client-side creation.

-- Index for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
