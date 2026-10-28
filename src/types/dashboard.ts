export interface TrendPoint {
  date: string;
  passed: number;
  failed: number;
}

export interface ExecutionRun {
  id: string;
  build: string;
  branch: string;
  environment: string;
  status: string;
  startedAt: string;
}

export interface Kpis {
  testCases: number;
  executionsToday: number;
  passRate: number;
  openDefects: number;
}

export interface ReleaseReadiness {
  score: number;
  status: string;
}

export interface DashboardData {
  generatedAt: string;
  kpis: Kpis;
  trend: TrendPoint[];
  releaseReadiness: ReleaseReadiness;
  recentExecutions: ExecutionRun[];
}

export function isTrendPoint(value: unknown): value is TrendPoint {
  return (
    typeof value === "object" &&
    value !== null &&
    "date" in value &&
    typeof (value as Record<string, unknown>).date === "string" &&
    "passed" in value &&
    typeof (value as Record<string, unknown>).passed === "number" &&
    "failed" in value &&
    typeof (value as Record<string, unknown>).failed === "number"
  );
}

export function isExecutionRun(value: unknown): value is ExecutionRun {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Record<string, unknown>).id === "string" &&
    "build" in value &&
    typeof (value as Record<string, unknown>).build === "string" &&
    "branch" in value &&
    typeof (value as Record<string, unknown>).branch === "string" &&
    "environment" in value &&
    typeof (value as Record<string, unknown>).environment === "string" &&
    "status" in value &&
    typeof (value as Record<string, unknown>).status === "string" &&
    "startedAt" in value &&
    typeof (value as Record<string, unknown>).startedAt === "string"
  );
}

export function isDashboardData(value: unknown): value is DashboardData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("generatedAt" in value) ||
    typeof (value as Record<string, unknown>).generatedAt !== "string" ||
    !("kpis" in value) ||
    !("trend" in value) ||
    !("releaseReadiness" in value) ||
    !("recentExecutions" in value) ||
    !Array.isArray((value as Record<string, unknown>).trend) ||
    !Array.isArray((value as Record<string, unknown>).recentExecutions)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const kpis = record.kpis;
  const trend = record.trend as unknown[];
  const recentExecutions = record.recentExecutions as unknown[];
  const readiness = record.releaseReadiness;

  if (!trend.every(isTrendPoint)) return false;
  if (!recentExecutions.every(isExecutionRun)) return false;

  return (
    typeof kpis === "object" &&
    kpis !== null &&
    "testCases" in kpis &&
    typeof (kpis as Record<string, unknown>).testCases === "number" &&
    "executionsToday" in kpis &&
    typeof (kpis as Record<string, unknown>).executionsToday === "number" &&
    "passRate" in kpis &&
    typeof (kpis as Record<string, unknown>).passRate === "number" &&
    "openDefects" in kpis &&
    typeof (kpis as Record<string, unknown>).openDefects === "number" &&
    typeof readiness === "object" &&
    readiness !== null &&
    "score" in readiness &&
    typeof (readiness as Record<string, unknown>).score === "number" &&
    "status" in readiness &&
    typeof (readiness as Record<string, unknown>).status === "string"
  );
}