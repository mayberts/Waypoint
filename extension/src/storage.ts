export interface WaypointConfig {
  serverUrl: string;
  apiToken: string;
}

export async function getConfig(): Promise<WaypointConfig | null> {
  const { serverUrl, apiToken } = await chrome.storage.local.get(["serverUrl", "apiToken"]);
  if (!serverUrl || !apiToken) return null;
  return { serverUrl: String(serverUrl).replace(/\/+$/, ""), apiToken: String(apiToken) };
}

export async function setConfig(config: WaypointConfig): Promise<void> {
  await chrome.storage.local.set(config);
}
