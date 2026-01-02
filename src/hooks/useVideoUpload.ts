import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVideoUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadVideo: (blob: Blob, userId: string) => Promise<string | null>;
}

export function useVideoUpload(): UseVideoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadVideo = async (blob: Blob, userId: string): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const fileName = `${userId}/${Date.now()}.webm`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(data.path);

      setProgress(100);
      return publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload video';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    progress,
    error,
    uploadVideo,
  };
}
