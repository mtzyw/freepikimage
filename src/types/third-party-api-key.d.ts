export interface ThirdPartyApiKey {
  id: number;
  provider: string;
  api_key: string;
  status: 'active' | 'disabled';
  created_at?: Date;
}

export interface ApiKeyRotationResult {
  success: boolean;
  apiKey?: string;
  keyId?: number;
  error?: string;
}