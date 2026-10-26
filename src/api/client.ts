export type AccessTokenProvider = () => Promise<string>;

export async function fetchQaApi(
  path: string,
  getAccessToken: AccessTokenProvider,
  init: RequestInit = {}
): Promise<Response> {
  if (!path.startsWith("/api/")) {
    throw new Error("QA API requests must use a same-origin /api/ path.");
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
