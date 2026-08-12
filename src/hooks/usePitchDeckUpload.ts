import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface UsePitchDeckUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadDeck: (
    file: File,
    ventureId: string,
    _userId: string,
    title?: string
  ) => Promise<string | null>;
}

export function usePitchDeckUpload(): UsePitchDeckUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.ventures.generatePitchDeckUploadUrl);
  const addPitchDeck = useMutation(api.ventures.addPitchDeck);

  const uploadDeck = async (
    file: File,
    ventureId: string,
    _userId: string,
    title = "Pitch Deck"
  ): Promise<string | null> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Please upload a PDF or PowerPoint file");
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File size must be less than 50MB");
      }

      setProgress(20);
      const uploadUrl = await generateUploadUrl({});
      setProgress(40);

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = (await result.json()) as {
        storageId: Id<"_storage">;
      };
      setProgress(70);

      const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
      const fileUrl = `${convexUrl}/api/storage/${storageId}`;

      await addPitchDeck({
        ventureId: ventureId as Id<"ventures">,
        title,
        fileUrl,
        fileType: file.type === "application/pdf" ? "pdf" : "pptx",
        storageId,
      });

      setProgress(100);
      return fileUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload pitch deck";
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, progress, error, uploadDeck };
}
