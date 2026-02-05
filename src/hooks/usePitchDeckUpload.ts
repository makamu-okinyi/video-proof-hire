import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsePitchDeckUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadDeck: (file: File, ventureId: string, userId: string, title?: string) => Promise<string | null>;
}

export function usePitchDeckUpload(): UsePitchDeckUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadDeck = async (
    file: File,
    ventureId: string,
    userId: string,
    title: string = 'Pitch Deck'
  ): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a PDF or PowerPoint file');
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size must be less than 50MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${ventureId}/${Date.now()}.${fileExt}`;

      setProgress(20);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('pitch-decks')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(60);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pitch-decks')
        .getPublicUrl(data.path);

      // Mark previous decks as not current
      await supabase
        .from('pitch_decks')
        .update({ is_current: false })
        .eq('venture_id', ventureId);

      setProgress(80);

      // Get next version number
      const { data: existingDecks } = await supabase
        .from('pitch_decks')
        .select('version')
        .eq('venture_id', ventureId)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingDecks && existingDecks.length > 0 
        ? existingDecks[0].version + 1 
        : 1;

      // Create pitch_deck record
      const { error: insertError } = await supabase.from('pitch_decks').insert({
        venture_id: ventureId,
        title,
        file_url: urlData.publicUrl,
        file_type: file.type === 'application/pdf' ? 'pdf' : 'pptx',
        version: nextVersion,
        is_current: true,
        uploaded_by: userId,
      });

      if (insertError) {
        throw insertError;
      }

      setProgress(100);
      return urlData.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload pitch deck';
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
    uploadDeck,
  };
}
