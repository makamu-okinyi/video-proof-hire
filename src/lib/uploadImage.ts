export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_MB = 5;

/** Validates an image file and POSTs it to a Convex upload URL. Returns the storage id. */
export async function uploadImageToConvex(file: File, getUploadUrl: () => Promise<string>): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Please choose a JPEG, PNG, WebP or GIF image.');
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`That image is too large. The limit is ${MAX_IMAGE_MB}MB.`);
  const uploadUrl = await getUploadUrl();
  const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('The upload did not go through. Please try again.');
  const { storageId } = (await res.json()) as { storageId: string };
  return storageId;
}
