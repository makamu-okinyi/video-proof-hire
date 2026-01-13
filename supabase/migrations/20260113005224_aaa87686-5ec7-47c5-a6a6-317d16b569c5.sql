-- Job Applications: Allow applicants to withdraw (delete) their own applications
CREATE POLICY "Applicants can withdraw their own applications"
ON public.job_applications
FOR DELETE
USING (auth.uid() = applicant_id);

-- Challenge Submissions: Allow users to update their own submissions
CREATE POLICY "Users can update their own submissions"
ON public.challenge_submissions
FOR UPDATE
USING (auth.uid() = user_id);

-- Challenge Submissions: Allow users to delete/withdraw their own submissions
CREATE POLICY "Users can delete their own submissions"
ON public.challenge_submissions
FOR DELETE
USING (auth.uid() = user_id);

-- User Roles: Allow users to update their own role (e.g., switch from talent to employer)
CREATE POLICY "Users can update their own role"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id);

-- Conversations: Allow participants to update conversations (e.g., mark as archived)
CREATE POLICY "Participants can update their conversations"
ON public.conversations
FOR UPDATE
USING ((auth.uid() = employer_id) OR (auth.uid() = candidate_id));

-- Conversations: Allow participants to delete their conversations
CREATE POLICY "Participants can delete their conversations"
ON public.conversations
FOR DELETE
USING ((auth.uid() = employer_id) OR (auth.uid() = candidate_id));

-- Messages: Allow users to delete their own sent messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);