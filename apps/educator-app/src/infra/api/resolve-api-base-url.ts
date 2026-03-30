import { NativeModules, Platform } from 'react-native';

function normalize(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function hostFromScriptUrl(scriptUrl?: string): string | null {
  if (!scriptUrl) return null;

  try {
    return new URL(scriptUrl).hostname || null;
  } catch {
    const match = scriptUrl.match(/^[a-zA-Z]+:\/\/([^/:]+)/);
    return match?.[1] ?? null;
  }
}

export function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && explicit.trim().length > 0) {
    return normalize(explicit);
  }

  const scriptUrl = (NativeModules as { SourceCode?: { scriptURL?: string } })?.SourceCode?.scriptURL;
  const host = hostFromScriptUrl(scriptUrl);

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}
