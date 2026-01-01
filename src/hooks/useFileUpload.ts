import { useState, useCallback, useRef } from 'react';

interface UseFileUploadOptions {
  accept?: string;
  maxSizeMB?: number;
}

export function useFileUpload({ accept = 'video/*', maxSizeMB = 100 }: UseFileUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError(null);
    
    if (!selectedFile) return;

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    // Check file type
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }

    setIsLoading(true);
    
    // Clean up previous URL
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setFileUrl(url);
    setIsLoading(false);

    // Reset input so the same file can be selected again
    event.target.value = '';
  }, [fileUrl, maxSizeMB]);

  const clearFile = useCallback(() => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFile(null);
    setFileUrl(null);
    setError(null);
  }, [fileUrl]);

  return {
    inputRef,
    handleFileChange,
    file,
    fileUrl,
    error,
    isLoading,
    openFilePicker,
    clearFile,
  };
}
