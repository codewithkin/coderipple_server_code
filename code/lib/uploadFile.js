import { uploadDirect } from '@uploadcare/upload-client'

export default async function UploadFile(fileBlob) {
  // fileData must be `Blob` or `File` or `Buffer`
  const result = await uploadDirect(
    fileBlob,
    {
      publicKey: "07467f541ac1cffdd4a4",
      store: 'auto',
    }
  )

  // Return the file's cdn url
  return result.cdnUrl  
}