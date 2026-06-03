-- #3 batch: notifications forge-vector + venture_founders linkage exposure.

-- (1) notifications: drop the public WITH CHECK(true) insert policy. Notifications are
-- created by SECURITY DEFINER triggers (notify_on_follow/like/job_application,
-- add_video_comment) and the service_role edge function — both bypass RLS — so no
-- public insert policy is needed. Removing it stops clients forging notifications.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- (2) venture_founders SELECT: stop exposing founder<->venture links for non-public
-- ventures. Public sees founders of ACTIVE ventures; you see your own row; admins see all.
DROP POLICY IF EXISTS "Anyone can view venture founders" ON public.venture_founders;
DROP POLICY IF EXISTS "View founders of active ventures, own, or admin" ON public.venture_founders;
CREATE POLICY "View founders of active ventures, own, or admin"
ON public.venture_founders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ventures v WHERE v.id = venture_founders.venture_id AND v.is_active = true)
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);
-- TODO(post-launch): when co-founder invites ship, replace the self-row check with a
-- SECURITY DEFINER membership helper so co-founders see the full team on private ventures
-- (a direct venture_founders subquery in this policy would recurse under RLS).
