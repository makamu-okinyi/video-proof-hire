-- =============================================
-- ACTIVATE ALL FEATURES MIGRATION
-- =============================================

-- 1. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('view', 'like', 'comment', 'match', 'interview', 'application', 'message', 'follow')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    related_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    related_job_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- 2. VIDEO LIKES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.video_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);

-- RLS for video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view video likes"
    ON public.video_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like videos"
    ON public.video_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike videos"
    ON public.video_likes FOR DELETE
    USING (auth.uid() = user_id);

-- 3. VIDEO COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.video_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON public.video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON public.video_comments(parent_id);

-- RLS for video_comments
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on public videos"
    ON public.video_comments FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can comment"
    ON public.video_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON public.video_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON public.video_comments FOR DELETE
    USING (auth.uid() = user_id);

-- 4. SAVED VIDEOS (BOOKMARKS) TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.saved_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_videos_user_id ON public.saved_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_videos_video_id ON public.saved_videos(video_id);

-- RLS for saved_videos
ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their saved videos"
    ON public.saved_videos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save videos"
    ON public.saved_videos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave videos"
    ON public.saved_videos FOR DELETE
    USING (auth.uid() = user_id);

-- 5. VIDEO VIEWS TABLE (for unique view tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS public.video_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewer_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON public.video_views(user_id);

-- RLS for video_views
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record views"
    ON public.video_views FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Video owners can see view analytics"
    ON public.video_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.videos v
            WHERE v.id = video_views.video_id
            AND v.user_id = auth.uid()
        )
    );

-- 6. ARTICLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    tags TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON public.articles(is_published);

-- RLS for articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles"
    ON public.articles FOR SELECT
    USING (is_published = true OR auth.uid() = author_id);

CREATE POLICY "Users can create articles"
    ON public.articles FOR INSERT
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own articles"
    ON public.articles FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own articles"
    ON public.articles FOR DELETE
    USING (auth.uid() = author_id);

-- 7. USER FOLLOWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

-- RLS for user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
    ON public.user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON public.user_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.user_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- 8. FUNCTIONS FOR LIKE/UNLIKE WITH COUNT UPDATES
-- =============================================

-- Function to like a video
CREATE OR REPLACE FUNCTION public.like_video(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.video_likes (video_id, user_id)
    VALUES (target_video_id, auth.uid())
    ON CONFLICT (video_id, user_id) DO NOTHING;
    
    -- Update the likes count on the video
    UPDATE public.videos
    SET likes = (SELECT COUNT(*) FROM public.video_likes WHERE video_id = target_video_id)
    WHERE id = target_video_id;
    
    RETURN true;
END;
$$;

-- Function to unlike a video
CREATE OR REPLACE FUNCTION public.unlike_video(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.video_likes
    WHERE video_id = target_video_id AND user_id = auth.uid();
    
    -- Update the likes count on the video
    UPDATE public.videos
    SET likes = (SELECT COUNT(*) FROM public.video_likes WHERE video_id = target_video_id)
    WHERE id = target_video_id;
    
    RETURN true;
END;
$$;

-- Function to check if user has liked a video
CREATE OR REPLACE FUNCTION public.has_liked_video(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.video_likes
        WHERE video_id = target_video_id AND user_id = auth.uid()
    );
END;
$$;

-- Function to save a video
CREATE OR REPLACE FUNCTION public.save_video(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.saved_videos (video_id, user_id)
    VALUES (target_video_id, auth.uid())
    ON CONFLICT (video_id, user_id) DO NOTHING;
    
    RETURN true;
END;
$$;

-- Function to unsave a video
CREATE OR REPLACE FUNCTION public.unsave_video(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.saved_videos
    WHERE video_id = target_video_id AND user_id = auth.uid();
    
    RETURN true;
END;
$$;

-- Function to check if user has saved a video
CREATE OR REPLACE FUNCTION public.has_saved_video(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.saved_videos
        WHERE video_id = target_video_id AND user_id = auth.uid()
    );
END;
$$;

-- Function to record a video view
CREATE OR REPLACE FUNCTION public.record_video_view(target_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.video_views (video_id, user_id)
    VALUES (target_video_id, auth.uid());
    
    -- Update the views count on the video
    UPDATE public.videos
    SET views = views + 1
    WHERE id = target_video_id;
    
    RETURN true;
END;
$$;

-- Function to get user's saved videos
CREATE OR REPLACE FUNCTION public.get_saved_videos()
RETURNS TABLE (
    id UUID,
    video_url TEXT,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    views INTEGER,
    likes INTEGER,
    created_at TIMESTAMPTZ,
    creator_id UUID,
    creator_username TEXT,
    creator_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.video_url,
        v.thumbnail_url,
        v.title,
        v.description,
        v.views,
        v.likes,
        v.created_at,
        p.id as creator_id,
        p.username as creator_username,
        p.avatar as creator_avatar
    FROM public.saved_videos sv
    JOIN public.videos v ON sv.video_id = v.id
    JOIN public.profiles p ON v.user_id = p.id
    WHERE sv.user_id = auth.uid()
    ORDER BY sv.created_at DESC;
END;
$$;

-- Function to get video comments
CREATE OR REPLACE FUNCTION public.get_video_comments(target_video_id UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    likes_count INTEGER,
    created_at TIMESTAMPTZ,
    user_id UUID,
    username TEXT,
    avatar TEXT,
    is_verified BOOLEAN,
    parent_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.likes_count,
        c.created_at,
        c.user_id,
        p.username,
        p.avatar,
        p.is_verified,
        c.parent_id
    FROM public.video_comments c
    JOIN public.profiles p ON c.user_id = p.id
    WHERE c.video_id = target_video_id
    ORDER BY c.created_at DESC;
END;
$$;

-- Function to add a comment
CREATE OR REPLACE FUNCTION public.add_video_comment(
    target_video_id UUID,
    comment_content TEXT,
    comment_parent_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_comment_id UUID;
    video_owner_id UUID;
BEGIN
    INSERT INTO public.video_comments (video_id, user_id, content, parent_id)
    VALUES (target_video_id, auth.uid(), comment_content, comment_parent_id)
    RETURNING id INTO new_comment_id;
    
    -- Get video owner to create notification
    SELECT user_id INTO video_owner_id
    FROM public.videos
    WHERE id = target_video_id;
    
    -- Create notification for video owner (if not commenting on own video)
    IF video_owner_id != auth.uid() THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_user_id, related_video_id)
        VALUES (
            video_owner_id,
            'comment',
            'New Comment',
            'Someone commented on your video',
            auth.uid(),
            target_video_id
        );
    END IF;
    
    RETURN new_comment_id;
END;
$$;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    page_size INTEGER DEFAULT 20,
    page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    action_url TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    related_user_username TEXT,
    related_user_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.action_url,
        n.is_read,
        n.created_at,
        p.username as related_user_username,
        p.avatar as related_user_avatar
    FROM public.notifications n
    LEFT JOIN public.profiles p ON n.related_user_id = p.id
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN true;
END;
$$;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true
    WHERE user_id = auth.uid() AND is_read = false;
    
    RETURN true;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_val INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_val
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = false;
    
    RETURN count_val;
END;
$$;

-- 9. TRIGGERS FOR AUTO NOTIFICATIONS
-- =============================================

-- Trigger function for like notifications
CREATE OR REPLACE FUNCTION public.notify_on_video_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    video_owner_id UUID;
    liker_username TEXT;
BEGIN
    -- Get video owner
    SELECT user_id INTO video_owner_id
    FROM public.videos
    WHERE id = NEW.video_id;
    
    -- Get liker's username
    SELECT username INTO liker_username
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Don't notify if liking own video
    IF video_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_user_id, related_video_id)
        VALUES (
            video_owner_id,
            'like',
            'New Like',
            COALESCE(liker_username, 'Someone') || ' liked your video',
            NEW.user_id,
            NEW.video_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_video_like
    AFTER INSERT ON public.video_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_video_like();

-- Trigger function for follow notifications
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    follower_username TEXT;
BEGIN
    -- Get follower's username
    SELECT username INTO follower_username
    FROM public.profiles
    WHERE id = NEW.follower_id;
    
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id, action_url)
    VALUES (
        NEW.following_id,
        'follow',
        'New Follower',
        COALESCE(follower_username, 'Someone') || ' started following you',
        NEW.follower_id,
        '/user/' || NEW.follower_id
    );
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_follow
    AFTER INSERT ON public.user_follows
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_follow();

-- Trigger for job application notification
CREATE OR REPLACE FUNCTION public.notify_on_job_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_employer_id UUID;
    job_title TEXT;
    applicant_username TEXT;
BEGIN
    -- Get job details
    SELECT employer_id, title INTO job_employer_id, job_title
    FROM public.job_postings
    WHERE id = NEW.job_id;
    
    -- Get applicant's username
    SELECT username INTO applicant_username
    FROM public.profiles
    WHERE id = NEW.applicant_id;
    
    -- Notify employer
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id, related_job_id, action_url)
    VALUES (
        job_employer_id,
        'application',
        'New Application',
        COALESCE(applicant_username, 'Someone') || ' applied for ' || job_title,
        NEW.applicant_id,
        NEW.job_id,
        '/employer/jobs/' || NEW.job_id || '/applicants'
    );
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_job_application ON public.job_applications;
CREATE TRIGGER trigger_notify_on_job_application
    AFTER INSERT ON public.job_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_job_application();

-- 10. GRANT EXECUTE PERMISSIONS
-- =============================================
GRANT EXECUTE ON FUNCTION public.like_video(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlike_video(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_liked_video(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_video(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unsave_video(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_saved_video(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_video_view(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_saved_videos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_video_comments(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.add_video_comment(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
