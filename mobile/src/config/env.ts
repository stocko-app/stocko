const fallbackApiUrl = "http://localhost:5130";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? fallbackApiUrl;
