declare global {
  interface Window {
    __QA_MFE_AUTH__?: {
      getAccessToken: () => Promise<string>;
    };
  }
}

export async function fetchQaApi(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith("/api/")) {
    throw new Error("QA API requests must use a same-origin /api/ path.");
  }
  const getAccessToken = window.__QA_MFE_AUTH__?.getAccessToken;
  if (!getAccessToken) {
    throw new Error("The QA Pulse shell authentication provider is unavailable.");
  }
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(path, {
    ...init,
    headers,
    credentials: "omit"
  });
}
