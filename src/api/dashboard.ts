import { fetchQaApi, type AccessTokenProvider } from "./client";
import type { DashboardData } from "../types/dashboard";
import { isDashboardData } from "../types/dashboard";

export async function fetchDashboardData(
  getAccessToken: AccessTokenProvider,
): Promise<DashboardData> {
  const response = await fetchQaApi("/api/qa/dashboard", getAccessToken);
  if (!response.ok) {
    let message = `Dashboard request failed (${response.status}).`;
    try {
      const payload: unknown = await response.json();
      const record = payload as Record<string, unknown>;
      if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in record &&
        typeof record.error === "string"
      ) {
        message = record.error as string;
      } else if (
        "detail" in record &&
        typeof record.detail === "string"
      ) {
        message = record.detail as string;
      }
    } catch {
      // Keep the HTTP status when the server did not return JSON.
    }
    throw new Error(message);
  }
  const payload = await response.json();
  if (!isDashboardData(payload)) {
    throw new Error("The QA API returned an invalid dashboard response.");
  }
  return payload;
}

export async function fetchChartData(
  getAccessToken: AccessTokenProvider,
): Promise<{ generatedAt: string; trend: DashboardData["trend"] }> {
  const response = await fetchQaApi("/api/qa/chart-data", getAccessToken);
  if (!response.ok) {
    let message = `Chart data request failed (${response.status}).`;
    try {
      const payload: unknown = await response.json();
      const record = payload as Record<string, unknown>;
      if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in record &&
        typeof record.error === "string"
      ) {
        message = record.error as string;
      } else if (
        "detail" in record &&
        typeof record.detail === "string"
      ) {
        message = record.detail as string;
      }
    } catch {
      // Keep the HTTP status when the server did not return JSON.
    }
    throw new Error(message);
  }
  const payload = await response.json();
  const record = payload as Record<string, unknown>;
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("generatedAt" in record) ||
    typeof record.generatedAt !== "string" ||
    !("trend" in record) ||
    !Array.isArray(record.trend)
  ) {
    throw new Error("The QA API returned an invalid chart data response.");
  }
  return {
    generatedAt: record.generatedAt as string,
    trend: record.trend as DashboardData["trend"],
  };
}