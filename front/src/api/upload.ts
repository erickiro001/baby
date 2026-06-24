import { BASE_URL } from '@/lib/api';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

/**
 * Upload a single file to the server via multipart/form-data.
 * Returns the public URL path of the uploaded file.
 *
 * Design: file upload is an independent concern.
 * Timeline / Albums / Works only store URL strings — makes it trivial
 * to swap local disk for OBS/COS/S3 later.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api/v1/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || '上传失败');
  }

  const data = await res.json() as { code: number; message: string; data: UploadResult };
  return data.data;
}
