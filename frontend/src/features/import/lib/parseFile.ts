import api from '@/lib/api';

export async function parseFile(file: File, bankProfileId = 'generico'): Promise<{ date: string; amount: number }[]> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bankProfileId', bankProfileId);
  const { data } = await api.post('/parse-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.transactions;
}
