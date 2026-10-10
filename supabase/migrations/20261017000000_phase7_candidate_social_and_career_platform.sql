-- ==============================================================================
-- RYVOLT Migration 20261017000000: Phase 7 Candidate Social & Career Platform
-- Features: Professional Feed, My Network, Find People, Messaging, Notifications,
--           Student Verification, Interview Management, Privacy & Security
-- ==============================================================================

-- 1. PROFESSIONAL FEED POSTS
CREATE TABLE IF NOT EXISTS public.feed_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    post_type TEXT NOT NULL DEFAULT 'general'
        CHECK (post_type IN ('general', 'project_update', 'achievement', 'milestone')),
    likes_count INTEGER DEFAULT 0 NOT NULL,
    comments_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);

-- 2. POST REACTIONS (Likes)
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT DEFAULT 'like' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_post_reaction UNIQUE (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions(user_id);

-- 3. POST COMMENTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON public.post_comments(author_id);

-- 4. PROFESSIONAL NETWORK CONNECTIONS
CREATE TABLE IF NOT EXISTS public.network_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_connection_pair UNIQUE (requester_id, recipient_id),
    CONSTRAINT no_self_connections CHECK (requester_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS idx_network_connections_req ON public.network_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_rec ON public.network_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_network_connections_status ON public.network_connections(status);

-- 5. CONVERSATIONS & PRIVATE MESSAGING
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_one UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_two UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_conversation_participants UNIQUE (participant_one, participant_two),
    CONSTRAINT no_self_conversation CHECK (participant_one <> participant_two)
);
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant_one);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant_two);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at ASC);

-- 6. UNIFIED CANDIDATE NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.candidate_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'connection_request',
        'connection_accepted',
        'message',
        'application_update',
        'interview_scheduled',
        'post_reaction',
        'post_comment',
        'student_verification',
        'job_alert'
    )),
    link TEXT,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_notifs_user ON public.candidate_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notifs_read ON public.candidate_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_candidate_notifs_created ON public.candidate_notifications(created_at DESC);

-- 7. STUDENT VERIFICATION
CREATE TABLE IF NOT EXISTS public.student_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    department TEXT NOT NULL,
    student_id_number TEXT,
    expected_graduation_year INTEGER NOT NULL,
    evidence_url TEXT,
    evidence_file_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('not_started', 'pending', 'verified', 'rejected', 'action_required')),
    reviewer_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_student_verifications_user ON public.student_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_verifications_status ON public.student_verifications(status);

-- 8. CANDIDATE INTERVIEWS & PREPARATION
CREATE TABLE IF NOT EXISTS public.candidate_interviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES public.jobs(id) ON DELETE SET NULL,
    application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    round_name TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 45 NOT NULL,
    meeting_link TEXT,
    format TEXT DEFAULT 'video' NOT NULL CHECK (format IN ('video', 'phone', 'onsite', 'ai_mock')),
    status TEXT DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    prep_notes TEXT,
    candidate_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_interviews_user ON public.candidate_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_interviews_date ON public.candidate_interviews(scheduled_at);

-- 9. USER PRIVACY SETTINGS
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_visibility TEXT DEFAULT 'public' NOT NULL CHECK (profile_visibility IN ('public', 'network_only', 'private')),
    allow_connection_requests BOOLEAN DEFAULT TRUE NOT NULL,
    allow_direct_messages TEXT DEFAULT 'connections_only' NOT NULL CHECK (allow_direct_messages IN ('all', 'connections_only', 'none')),
    show_email BOOLEAN DEFAULT FALSE NOT NULL,
    show_phone BOOLEAN DEFAULT FALSE NOT NULL,
    notify_connections BOOLEAN DEFAULT TRUE NOT NULL,
    notify_messages BOOLEAN DEFAULT TRUE NOT NULL,
    notify_jobs BOOLEAN DEFAULT TRUE NOT NULL,
    notify_applications BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. USER BLOCKS & ABUSE REPORTS
CREATE TABLE IF NOT EXISTS public.user_blocks_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('block', 'report', 'mute')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_blocks_reporter ON public.user_blocks_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_target ON public.user_blocks_reports(target_user_id);

-- ------------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks_reports ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- IDEMPOTENT RLS POLICIES
-- ------------------------------------------------------------------------------

-- Feed posts: Viewable by authenticated users; author can insert, update, delete
DROP POLICY IF EXISTS "feed_posts_select" ON public.feed_posts;
CREATE POLICY "feed_posts_select" ON public.feed_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "feed_posts_insert" ON public.feed_posts;
CREATE POLICY "feed_posts_insert" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "feed_posts_update" ON public.feed_posts;
CREATE POLICY "feed_posts_update" ON public.feed_posts FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "feed_posts_delete" ON public.feed_posts;
CREATE POLICY "feed_posts_delete" ON public.feed_posts FOR DELETE USING (auth.uid() = author_id);

-- Post reactions
DROP POLICY IF EXISTS "reactions_select" ON public.post_reactions;
CREATE POLICY "reactions_select" ON public.post_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "reactions_insert" ON public.post_reactions;
CREATE POLICY "reactions_insert" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_delete" ON public.post_reactions;
CREATE POLICY "reactions_delete" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Post comments
DROP POLICY IF EXISTS "comments_select" ON public.post_comments;
CREATE POLICY "comments_select" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert" ON public.post_comments;
CREATE POLICY "comments_insert" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "comments_update" ON public.post_comments;
CREATE POLICY "comments_update" ON public.post_comments FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "comments_delete" ON public.post_comments;
CREATE POLICY "comments_delete" ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

-- Network connections: visible to requester and recipient
DROP POLICY IF EXISTS "connections_select" ON public.network_connections;
CREATE POLICY "connections_select" ON public.network_connections FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "connections_insert" ON public.network_connections;
CREATE POLICY "connections_insert" ON public.network_connections FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "connections_update" ON public.network_connections;
CREATE POLICY "connections_update" ON public.network_connections FOR UPDATE
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "connections_delete" ON public.network_connections;
CREATE POLICY "connections_delete" ON public.network_connections FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Conversations: participants only
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
    USING (auth.uid() = participant_one OR auth.uid() = participant_two);

DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
    USING (auth.uid() = participant_one OR auth.uid() = participant_two);

-- Messages: participants in the conversation only
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
              AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
        )
    );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
              AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
        )
    );

-- Notifications: user only
DROP POLICY IF EXISTS "notifications_user" ON public.candidate_notifications;
CREATE POLICY "notifications_user" ON public.candidate_notifications FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Student verification: user can see & submit own record
DROP POLICY IF EXISTS "student_verif_user" ON public.student_verifications;
CREATE POLICY "student_verif_user" ON public.student_verifications FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Interviews: user only
DROP POLICY IF EXISTS "interviews_user" ON public.candidate_interviews;
CREATE POLICY "interviews_user" ON public.candidate_interviews FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Privacy settings: user only
DROP POLICY IF EXISTS "privacy_user" ON public.user_privacy_settings;
CREATE POLICY "privacy_user" ON public.user_privacy_settings FOR ALL
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Blocks and reports: reporter can insert and see
DROP POLICY IF EXISTS "blocks_reporter" ON public.user_blocks_reports;
CREATE POLICY "blocks_reporter" ON public.user_blocks_reports FOR ALL
    USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

-- ------------------------------------------------------------------------------
-- PERMISSIONS & SCHEMA CACHE RELOAD
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
