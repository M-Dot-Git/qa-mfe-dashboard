import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  fetchGitHubRepositories,
  fetchPullRequestDetail,
  fetchPullRequests,
  type GitHubRepository,
  type PullRequest,
  type PullRequestDetail as PullRequestDetailData,
} from "../api/github";
import type { AccessTokenProvider } from "../api/client";

interface GitHubPullRequestsProps {
  getAccessToken?: AccessTokenProvider;
}

function useGitHubRepositories(getAccessToken?: AccessTokenProvider) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAccessToken) {
      setError("Authentication token provider is not available.");
      setLoading(false);
      return;
    }
    let active = true;
    fetchGitHubRepositories(getAccessToken)
      .then((items) => {
        if (active) setRepositories(items);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load repositories.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  return { repositories, loading, error };
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function StatusBadge({ value }: { value: string | null }) {
  const normalized = value?.toLowerCase().replaceAll("_", "-") ?? "unknown";
  return <span className={`github-badge github-badge-${normalized}`}>{value ?? "Unknown"}</span>;
}

function PullRequestCard({
  pullRequest,
}: {
  pullRequest: PullRequest;
}) {
  return (
    <Link
      className="github-pr-card"
      to={`/dashboard/github/prs/${pullRequest.number}?repo=${encodeURIComponent(pullRequest.repo)}`}
    >
      <div className="github-pr-card-heading">
        <div>
          <span className="github-pr-number">
            {pullRequest.repo} #{pullRequest.number}
          </span>
          <h3>{pullRequest.title}</h3>
        </div>
        <StatusBadge value={pullRequest.reviewDecision} />
      </div>
      <div className="github-pr-meta">
        <span>{pullRequest.author?.login ?? "Unknown author"}</span>
        <span>{pullRequest.headRef} → {pullRequest.baseRef}</span>
        <span>Updated {formatDate(pullRequest.updatedAt)}</span>
      </div>
      <div className="github-pr-card-footer">
        <span className="github-change-count">
          <span className="github-additions">+{pullRequest.additions}</span>{" "}
          <span className="github-deletions">-{pullRequest.deletions}</span>
          <span> · {pullRequest.changedFiles} files</span>
        </span>
        <StatusBadge value={pullRequest.ciState} />
      </div>
      {pullRequest.labels.length > 0 && (
        <div className="github-labels">
          {pullRequest.labels.map((label) => (
            <span
              className="github-label"
              key={label.name}
              style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function PullRequestList({ getAccessToken }: GitHubPullRequestsProps) {
  const { repositories, loading: reposLoading, error: reposError } =
    useGitHubRepositories(getAccessToken);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRepo, setSelectedRepo] = useState("");
  const [state, setState] = useState("open");
  const [after, setAfter] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<(string | null)[]>([]);
  const [items, setItems] = useState<PullRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const repoFromUrl = searchParams.get("repo");
    if (repoFromUrl && repositories.some((repo) => repo.fullName === repoFromUrl)) {
      setSelectedRepo(repoFromUrl);
    } else if (!selectedRepo && repositories.length > 0) {
      setSelectedRepo(repositories[0].fullName);
    }
  }, [repositories, searchParams, selectedRepo]);

  useEffect(() => {
    if (!getAccessToken || !selectedRepo) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetchPullRequests(getAccessToken, selectedRepo, state, after)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotalCount(result.totalCount);
        setHasNext(result.hasNext);
        setEndCursor(result.endCursor);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load pull requests.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getAccessToken, selectedRepo, state, after, retryKey]);

  const changeRepo = (repo: string) => {
    setSelectedRepo(repo);
    setSearchParams(repo ? { repo } : {});
    setAfter(null);
    setPreviousCursors([]);
  };
  const changeState = (nextState: string) => {
    setState(nextState);
    setAfter(null);
    setPreviousCursors([]);
  };

  return (
    <div className="github-page">
      <header className="github-page-heading">
        <div>
          <span className="eyebrow">ENGINEERING ACTIVITY</span>
          <h1>Pull requests</h1>
          <p>Review pull requests and their checks across configured repositories.</p>
        </div>
        <Link className="quiet-button" to="/dashboard">Back to workspace</Link>
      </header>
      {reposError && <section className="data-error" role="alert">{reposError}</section>}
      <section className="panel github-pr-list">
        <div className="github-toolbar">
          <label>
            Repository
            <select
              value={selectedRepo}
              onChange={(event) => changeRepo(event.target.value)}
              disabled={reposLoading || repositories.length === 0}
            >
              {repositories.length === 0 && <option value="">No repositories configured</option>}
              {repositories.map((repo) => (
                <option key={repo.fullName} value={repo.fullName}>{repo.fullName}</option>
              ))}
            </select>
          </label>
          <label>
            State
            <select value={state} onChange={(event) => changeState(event.target.value)}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <span className="github-count">{totalCount.toLocaleString()} pull requests</span>
        </div>
        {error && (
          <section className="data-error" role="alert">
            <div><strong>Could not load pull requests</strong><p>{error}</p></div>
            <button className="quiet-button" onClick={() => setRetryKey((key) => key + 1)}>Retry</button>
          </section>
        )}
        {loading && <div className="github-empty" aria-live="polite">Loading pull requests…</div>}
        {!loading && !error && !reposLoading && repositories.length === 0 && (
          <div className="github-empty">No GitHub repositories are configured for this service.</div>
        )}
        {!loading && !error && repositories.length > 0 && items.length === 0 && (
          <div className="github-empty">No {state} pull requests found in {selectedRepo}.</div>
        )}
        {!loading && items.length > 0 && (
          <div className="github-pr-grid">
            {items.map((pullRequest) => (
              <PullRequestCard key={`${pullRequest.repo}-${pullRequest.number}`} pullRequest={pullRequest} />
            ))}
          </div>
        )}
        <nav className="github-pagination" aria-label="Pull request pages">
          <button
            className="quiet-button"
            disabled={previousCursors.length === 0 || loading}
            onClick={() => {
              const cursors = [...previousCursors];
              setAfter(cursors.pop() ?? null);
              setPreviousCursors(cursors);
            }}
          >
            Previous
          </button>
          <button
            className="quiet-button"
            disabled={!hasNext || !endCursor || loading}
            onClick={() => {
              setPreviousCursors((cursors) => [...cursors, after]);
              setAfter(endCursor);
            }}
          >
            Next
          </button>
        </nav>
      </section>
    </div>
  );
}

function PullRequestDetail({ getAccessToken }: GitHubPullRequestsProps) {
  const { number } = useParams();
  const [searchParams] = useSearchParams();
  const repo = searchParams.get("repo") ?? "";
  const [detail, setDetail] = useState<PullRequestDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken || !repo || !number) {
      setError("A repository and pull request number are required.");
      setLoading(false);
      return;
    }
    let active = true;
    setDetail(null);
    setLoading(true);
    setError(null);
    fetchPullRequestDetail(getAccessToken, repo, Number(number))
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Could not load pull request details.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getAccessToken, repo, number]);

  return (
    <div className="github-page">
      <Link className="back-to-apps" to={`/dashboard/github?repo=${encodeURIComponent(repo)}`}>
        ← Back to pull requests
      </Link>
      {loading && <section className="welcome-panel">Loading pull request details…</section>}
      {error && <section className="data-error" role="alert">{error}</section>}
      {detail && <PullRequestDetailContent detail={detail} />}
    </div>
  );
}

function PullRequestDetailContent({ detail }: { detail: PullRequestDetailData }) {
  return (
    <>
      <header className="github-detail-heading">
        <span className="github-pr-number">{detail.repo} #{detail.number}</span>
        <h1>{detail.title}</h1>
        <div className="github-detail-meta">
          <StatusBadge value={detail.merged ? "MERGED" : detail.state} />
          {detail.isDraft && <StatusBadge value="DRAFT" />}
          <span>{detail.author?.login ?? "Unknown author"} · Opened {formatDate(detail.createdAt)}</span>
          <a href={detail.url} target="_blank" rel="noreferrer">View on GitHub ↗</a>
        </div>
        <p className="github-branch-line">
          <code>{detail.headRef}</code> → <code>{detail.baseRef}</code> · {detail.headSha.slice(0, 7)}
        </p>
        <div className="github-labels">
          {detail.labels.map((label) => (
            <span
              className="github-label"
              key={label.name}
              style={{ borderColor: `#${label.color}`, color: `#${label.color}` }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </header>
      <div className="github-detail-grid">
        <section className="panel github-detail-main">
          <h2>Description</h2>
          <div className="github-markdown">{detail.bodyMarkdown || "No description provided."}</div>
          <h2>Files changed <span className="github-count">({detail.files.length})</span></h2>
          <div className="github-files">
            {detail.files.map((file) => (
              <details className="github-file" key={file.filename}>
                <summary>
                  <code>{file.filename}</code>
                  <span className="github-file-status">{file.status}</span>
                  <span className="github-additions">+{file.additions}</span>
                  <span className="github-deletions">-{file.deletions}</span>
                </summary>
                {file.patch ? (
                  <pre>{file.patch}</pre>
                ) : (
                  <p>{file.truncated ? "Patch unavailable (binary or too large)." : "No patch available."}</p>
                )}
              </details>
            ))}
          </div>
        </section>
        <aside className="github-detail-side">
          <section className="panel">
            <h2>Checks</h2>
            <StatusBadge value={detail.ci.state} />
            {detail.ci.checks.length === 0 ? (
              <p className="github-muted">No status checks reported.</p>
            ) : detail.ci.checks.map((check) => (
              <div className="github-check" key={check.name}>
                <span>{check.name}</span>
                <StatusBadge value={check.conclusion ?? check.status} />
              </div>
            ))}
          </section>
          <section className="panel">
            <h2>Reviews</h2>
            <StatusBadge value={detail.approvals.reviewDecision} />
            {detail.approvals.requested.map((reviewer) => (
              <p className="github-muted" key={`${reviewer.type}-${reviewer.name}`}>
                Requested {reviewer.type}: {reviewer.name}
              </p>
            ))}
            {detail.approvals.reviews.map((review, index) => (
              <article className="github-activity" key={`${review.author?.login ?? "review"}-${index}`}>
                <strong>{review.author?.login ?? "Unknown reviewer"} · {review.state}</strong>
                <p>{review.body || "No review comment."}</p>
              </article>
            ))}
          </section>
          <section className="panel">
            <h2>Conversation</h2>
            {detail.conversation.length === 0 ? (
              <p className="github-muted">No comments yet.</p>
            ) : detail.conversation.map((comment, index) => (
              <article className="github-activity" key={`${comment.author?.login ?? "comment"}-${index}`}>
                <strong>{comment.author?.login ?? "Unknown user"} · {formatDate(comment.createdAt)}</strong>
                <p>{comment.body}</p>
              </article>
            ))}
          </section>
          <section className="panel">
            <h2>Review threads</h2>
            {detail.reviewThreads.length === 0 ? (
              <p className="github-muted">No inline review threads.</p>
            ) : detail.reviewThreads.map((thread, index) => (
              <article className="github-activity" key={`${thread.path}-${thread.line}-${index}`}>
                <strong>{thread.path}{thread.line ? `:${thread.line}` : ""}</strong>
                <p>{thread.isResolved ? "Resolved" : "Unresolved"}{thread.isOutdated ? " · outdated" : ""}</p>
                {thread.comments.map((comment, commentIndex) => (
                  <p key={`${comment.createdAt}-${commentIndex}`}>
                    <b>{comment.author?.login ?? "Unknown user"}:</b> {comment.body}
                  </p>
                ))}
              </article>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}

export function GitHubPullRequests({ getAccessToken }: GitHubPullRequestsProps) {
  const { number } = useParams();
  return number ? (
    <PullRequestDetail getAccessToken={getAccessToken} />
  ) : (
    <PullRequestList getAccessToken={getAccessToken} />
  );
}
