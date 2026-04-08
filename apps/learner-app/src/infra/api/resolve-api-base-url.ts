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

function hostFromBaseUrl(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname || null;
  } catch {
    const match = url.match(/^[a-zA-Z]+:\/\/([^/:]+)/);
    return match?.[1] ?? null;
  }
}

function isIpv4(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
}

function isLoopbackHost(host: string | null): boolean {
  if (!host) return false;
  return host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';
}

export function resolveApiBaseUrl(): string {
  const scriptUrl = (NativeModules as { SourceCode?: { scriptURL?: string } })?.SourceCode?.scriptURL;
  const metroHost = hostFromScriptUrl(scriptUrl);
  const isNativeRuntime = Platform.OS === 'android' || Platform.OS === 'ios';

  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && explicit.trim().length > 0) {
    const normalizedExplicit = normalize(explicit);
    const explicitHost = hostFromBaseUrl(normalizedExplicit);

    const isWrongHostOnNative = isNativeRuntime && isLoopbackHost(explicitHost);
    if (isWrongHostOnNative) {
      if (metroHost && isIpv4(metroHost) && !isLoopbackHost(metroHost)) {
        return `http://${metroHost}:3000`;
      }

      if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
      }
    }

    return normalizedExplicit;
  }

  if (metroHost && isIpv4(metroHost)) {
    return `http://${metroHost}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}
