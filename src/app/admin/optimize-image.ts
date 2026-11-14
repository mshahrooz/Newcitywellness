/** Re-encode the user's public website photo. No original or metadata is uploaded. */
export async function optimizeImage(file: File, maximumWidth = 1600) {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error("Choose a JPEG, PNG, WebP, or AVIF photo no larger than 15 MB.")
  }
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maximumWidth / bitmap.width, 1600 / bitmap.height)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("This browser could not resize the photo.")
    context.drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", .84))
    if (!blob || blob.type !== "image/webp" || blob.size > 800 * 1024) throw new Error("The photo could not be compressed to a WebP under 800 KB. Try a smaller image.")
    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}
