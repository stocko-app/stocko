import { API_BASE_URL } from "../config/env";

export async function checkHealth(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}
