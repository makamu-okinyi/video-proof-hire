-- Enable Realtime for ventures table so Admin Panel graph updates in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.ventures;
