import { useEffect, useState, type ComponentType } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { TrendChart } from "./components/TrendChart";
import { fetchDashboardData } from "./api/dashboard";
import type { DashboardData } from "./types/dashboard";
import "./styles.css";

interface DashboardProps {
  getAccessToken?: (() => Promise<string>) | undefined;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function statusTone(status: string): "success" | "danger" | "warning" | "neutral" {
  switch (status.trim().toLowerCase()) {
    case "passed":
    case "ready":
      return "success";
    case "failed":
      return "danger";
    case "flaky":
      return "warning";
    default:
      return "neutral";
  }
}

function DashboardOverview({ getAccessToken }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getAccessToken) {
      setError("Authentication token provider is not available.");
      setLoading(false);
      return;
    }

    let controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchDashboardData(getAccessToken)
      .then((payload) => {
        if (controller.signal.aborted) return;
        setData(payload);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Could not load QA dashboard data.");
        setLoading(false);
      });

    return () => controller.abort();
  }, [getAccessToken, reloadKey]);

  const retry = () => setReloadKey((value) => value + 1);

  return (
    <div className="mfe">
      <div className="page-heading">
        <div>
          <span className="eyebrow">QUALITY OVERVIEW</span>
          <h1>QA Insights</h1>
          <p>Release confidence and test execution health in one place.</p>
        </div>
        <span className={`api-pill ${error ? "api-pill-error" : ""}`}>
          <i />
          {error ? "API unavailable" : loading ? "Loading QA data" : "Live data"}
        </span>
      </div>
      {error && (
        <section className="data-error" role="alert">
          <div>
            <strong>Could not load QA data</strong>
            <p>{error}</p>
          </div>
          <button className="quiet-button" onClick={retry}>
            Retry
          </button>
        </section>
      )}
      {!error && loading && (
        <section className="welcome-panel">
          <span className="spinner" />
          <div>
            <strong>Loading QA metrics</strong>
            <p>Connecting to the QA API…</p>
          </div>
        </section>
      )}
      {data && (
        <>
          <section
            className={`welcome-panel readiness-banner ${statusTone(data.releaseReadiness.status)}`}
          >
            <div className="welcome-icon">↗</div>
            <div>
              <strong>Release readiness: {data.releaseReadiness.status}</strong>
              <p>
                Generated {formatDate(data.generatedAt)} · Data is randomized in-memory and is not
                persisted.
              </p>
            </div>
          </section>
          <div className="kpi-grid">
            {[
              {
                label: "Test cases",
                value: data.kpis.testCases.toLocaleString(),
                detail: "Across functional and non-functional suites",
                tone: "neutral",
              },
              {
                label: "Executions today",
                value: data.kpis.executionsToday.toLocaleString(),
                detail: "Randomized sample count",
                tone: "neutral",
              },
              {
                label: "Pass rate",
                value: `${data.kpis.passRate}%`,
                detail: "Latest sampled QA runs",
                tone: statusTone(data.kpis.passRate >= 95 ? "passed" : "failed"),
              },
              {
                label: "Open defects",
                value: data.kpis.openDefects.toLocaleString(),
                detail: "Randomized sample count",
                tone: statusTone(data.kpis.openDefects === 0 ? "passed" : "failed"),
              },
            ].map(
              ({ label, value, detail, tone }) => (
                <article className={`kpi-card kpi-card-${tone}`} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{detail}</small>
                </article>
              ),
            )}
          </div>
          <div className="dashboard-grid">
            <TrendChart data={data.trend} />
            <section
              className={`panel readiness ${statusTone(data.releaseReadiness.status)}`}
            >
              <div className="panel-heading">
                <div>
                  <h2>Release readiness</h2>
                  <p>Build confidence at a glance</p>
                </div>
              </div>
              <div className="readiness-mark">{data.releaseReadiness.score}</div>
              <strong>{data.releaseReadiness.status}</strong>
              <p>Sample readiness score from randomized QA metrics.</p>
            </section>
          </div>
          <section className="panel executions">
            <div className="panel-heading">
              <div>
                <h2>Recent test executions</h2>
                <p>Sampled execution summaries from the QA API</p>
              </div>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Execution",
                      "Build",
                      "Branch",
                      "Environment",
                      "Status",
                      "Started",
                    ].map((col) => <th key={col}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.recentExecutions.map(
                    (run) => (
                      <tr key={run.id}>
                        <td>{run.id}</td>
                        <td>{run.build}</td>
                        <td>{run.branch}</td>
                        <td>{run.environment}</td>
                        <td>
                          <span className={`run-status ${statusTone(run.status)}`}>
                            {run.status}
                          </span>
                        </td>
                        <td>{formatDate(run.startedAt)}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function TestReportsRemote({ getAccessToken }: DashboardProps) {
  const [ReportsApp, setReportsApp] = useState<ComponentType<DashboardProps> | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setReportsApp(null);
    setReportsLoading(true);
    setReportsError(null);

    import("qa_test_reports/App")
      .then((module) => {
        if (!active) return;
        setReportsApp(() => module.default);
        setReportsLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setReportsError(
          error instanceof Error ? error.message : "Could not load Test Reports."
        );
        setReportsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryKey]);

  return (
    <div className="mfe">
      <Link className="back-to-apps" to="/dashboard">
        Back to workspace
      </Link>
      {reportsLoading && (
        <section className="welcome-panel" aria-live="polite">
          <span className="spinner" />
          <div>
            <strong>Loading Test Reports</strong>
            <p>Connecting to the reports micro-frontend…</p>
          </div>
        </section>
      )}
      {reportsError && (
        <section className="data-error" role="alert">
          <div>
            <strong>Could not load Test Reports</strong>
            <p>{reportsError}</p>
          </div>
          <button
            className="quiet-button"
            onClick={() => setRetryKey((value) => value + 1)}
          >
            Retry
          </button>
        </section>
      )}
      {ReportsApp && <ReportsApp getAccessToken={getAccessToken} />}
    </div>
  );
}

function WorkspaceLauncher() {
  return (
    <div className="mfe">
      <header className="launcher-heading">
        <span className="eyebrow">QUALITY WORKSPACE</span>
        <h1>Choose a workspace</h1>
        <p>Open your dashboard or explore test reports.</p>
      </header>
      <section className="launcher-grid" aria-label="Available workspaces">
        <Link
          className="launcher-card"
          to="/dashboard/overview"
        >
          <span className="launcher-card-index">01</span>
          <span className="launcher-card-kicker">QUALITY OVERVIEW</span>
          <strong>Dashboard</strong>
          <span className="launcher-card-description">
            Review release readiness, execution trends, and recent test activity.
          </span>
          <span className="launcher-card-action">Open dashboard</span>
        </Link>
        <Link
          className="launcher-card"
          to="/dashboard/test-reports"
        >
          <span className="launcher-card-index">02</span>
          <span className="launcher-card-kicker">QUALITY REPORTING</span>
          <strong>Test Reports</strong>
          <span className="launcher-card-description">
            View reports provided by the test reports service through the QA API.
          </span>
          <span className="launcher-card-action">Open Test Reports</span>
        </Link>
      </section>
    </div>
  );
}

export default function Dashboard({ getAccessToken }: DashboardProps) {
  return (
    <Routes>
      <Route index element={<WorkspaceLauncher />} />
      <Route
        path="overview"
        element={
          <div className="mfe">
            <Link className="back-to-apps" to="/dashboard">
              Back to workspace
            </Link>
            <DashboardOverview getAccessToken={getAccessToken} />
          </div>
        }
      />
      <Route
        path="test-reports/*"
        element={<TestReportsRemote getAccessToken={getAccessToken} />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
