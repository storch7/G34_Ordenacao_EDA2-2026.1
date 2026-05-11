export interface TopIp {
  ip: string;
  count: number;
  percentage: number;
}

export interface AnalyzeResult {
  totalRequests: number;
  processingTimeMs: number;
  topIps: TopIp[];
  error?: string;
}

const API_URL = 'http://localhost:3000/api';

export async function uploadAndAnalyzeLog(file: File): Promise<AnalyzeResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze log file');
    }

    return data as AnalyzeResult;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while connecting to the server');
  }
}
