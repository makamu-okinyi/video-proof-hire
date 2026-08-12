import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UseVideoUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadVideo: (blob: Blob, _userId: string) => Promise<{ url: string | null; storageId: Id<"_storage"> | null }>;
}

export function useVideoUpload(): UseVideoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.videos.generateUploadUrl);

  const uploadVideo = async (
    blob: Blob,
    _userId: string
  ): Promise<{ url: string | null; storageId: Id<"_storage"> | null }> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      setProgress(10);
      const uploadUrl = await generateUploadUrl({});
      setProgress(30);

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "video/webm" },
        body: blob,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
      setProgress(100);

      // Return storageId so caller can store it and use generateUrl on the server
      const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
      const url = `${convexUrl}/api/storage/${storageId}`;

      return { url, storageId };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload video";
      setError(message);
      return { url: null, storageId: null };
    } finally {
      setUploading(false);
    }
  };

  return { uploading, progress, error, uploadVideo };
}
