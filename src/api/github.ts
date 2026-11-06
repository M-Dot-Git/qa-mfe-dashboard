import { fetchQaApi, type AccessTokenProvider } from "./client";

export interface GitHubRepository {
  owner: string;
  repo: string;
  fullName: string;
}

export interface PullRequest {
  repo: string;
  number: number;
  title: string;
  isDraft: boolean;
  url: string;
  author: { login: string; avatarUrl: string } | null;
  labels: { name: string; color: string }[];
  headRef: string;
  baseRef: string;
  createdAt: string;
  updatedAt: string;
  reviewDecision: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  ciState: string | null;
}

export interface PullRequestList {
  items: PullRequest[];
  totalCount: number;
  hasNext: boolean;
  endCursor: string | null;
}

interface GitHubAuthor {
  login: string;
  avatarUrl?: string;
}

interface GitHubComment {
  author: { login: string } | null;
  body: string;
  createdAt: string;
}

export interface PullRequestDetail {
  repo: string;
  number: number;
  title: string;
  bodyMarkdown: string | null;
  state: string;
  merged: boolean;
  isDraft: boolean;
  mergeable: string | null;
  url: string;
  author: GitHubAuthor | null;
  createdAt: string;
  updatedAt: string;
  baseRef: string;
  headRef: string;
  headSha: string;
  labels: { name: string; color: string }[];
  approvals: {
    reviewDecision: string | null;
    requested: { type: string; name: string }[];
    reviews: {
      author: GitHubAuthor | null;
      state: string;
      submittedAt: string | null;
      body: string | null;
    }[];
  };
  reviewThreads: {
    path: string;
    line: number | null;
    isResolved: boolean;
    isOutdated: boolean;
    comments: GitHubComment[];
  }[];
  conversation: GitHubComment[];
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    patch: string | null;
    truncated: boolean;
  }[];
  ci: {
    state: string | null;
    checks: {
      name: string;
      status: string | null;
      conclusion: string | null;
      url: string | null;
    }[];
  };
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function isRepository(value: unknown): value is GitHubRepository {
  return (
    isRecord(value) &&
    typeof value.owner === "string" &&
    typeof value.repo === "string" &&
    typeof value.fullName === "string"
  );
}

function isPullRequest(value: unknown): value is PullRequest {
  return (
    isRecord(value) &&
    typeof value.repo === "string" &&
    typeof value.number === "number" &&
    typeof value.title === "string" &&
    typeof value.isDraft === "boolean" &&
    typeof value.url === "string" &&
    (value.author === null ||
      (isRecord(value.author) &&
        typeof value.author.login === "string" &&
        typeof value.author.avatarUrl === "string")) &&
    Array.isArray(value.labels) &&
    value.labels.every(
      (label) =>
        isRecord(label) &&
        typeof label.name === "string" &&
        typeof label.color === "string",
    ) &&
    typeof value.headRef === "string" &&
    typeof value.baseRef === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.additions === "number" &&
    typeof value.deletions === "number" &&
    typeof value.changedFiles === "number"
  );
}

function isPullRequestList(value: unknown): value is PullRequestList {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isPullRequest) &&
    typeof value.totalCount === "number" &&
    typeof value.hasNext === "boolean" &&
    (typeof value.endCursor === "string" || value.endCursor === null)
  );
}

function isPullRequestDetail(value: unknown): value is PullRequestDetail {
  if (!isRecord(value)) {
    return false;
  }
  const approvals = value.approvals;
  const ci = value.ci;
  if (!isRecord(approvals) || !isRecord(ci)) return false;
  if (
    typeof approvals.reviewDecision !== "string" &&
    approvals.reviewDecision !== null
  ) {
    return false;
  }
  return (
    typeof value.repo === "string" &&
    typeof value.number === "number" &&
    typeof value.title === "string" &&
    typeof value.state === "string" &&
    typeof value.merged === "boolean" &&
    typeof value.isDraft === "boolean" &&
    typeof value.url === "string" &&
    typeof value.headRef === "string" &&
    typeof value.baseRef === "string" &&
    typeof value.headSha === "string" &&
    Array.isArray(value.labels) &&
    Array.isArray(approvals.requested) &&
    Array.isArray(approvals.reviews) &&
    Array.isArray(value.reviewThreads) &&
    Array.isArray(value.conversation) &&
    Array.isArray(value.files) &&
    Array.isArray(ci.checks) &&
    (typeof ci.state === "string" || ci.state === null)
  );
}

async function requestJson<T>(
  path: string,
  getAccessToken: AccessTokenProvider,
  isPayload: (value: unknown) => value is T,
): Promise<T> {
  const response = await fetchQaApi(path, getAccessToken);
  if (!response.ok) {
    let message = `GitHub request failed (${response.status}).`;
    try {
      const payload: unknown = await response.json();
      if (
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string"
      ) {
        message = payload.error;
      } else if (
        typeof payload === "object" &&
        payload !== null &&
        "detail" in payload &&
        typeof payload.detail === "string"
      ) {
        message = payload.detail;
      }
    } catch {
      // Keep the HTTP status when the server did not return JSON.
    }
    throw new Error(message);
  }
  const payload: unknown = await response.json();
  if (!isPayload(payload)) {
    throw new Error("The QA API returned an invalid GitHub response.");
  }
  return payload;
}

export function fetchGitHubRepositories(
  getAccessToken: AccessTokenProvider,
): Promise<GitHubRepository[]> {
  return requestJson(
    "/api/github/repos",
    getAccessToken,
    (payload): payload is GitHubRepository[] =>
      Array.isArray(payload) && payload.every(isRepository),
  );
}

export function fetchPullRequests(
  getAccessToken: AccessTokenProvider,
  repo: string,
  state: string,
  after: string | null,
): Promise<PullRequestList> {
  const query = new URLSearchParams({ repo, state, first: "20" });
  if (after) query.set("after", after);
  return requestJson(`/api/github/prs?${query}`, getAccessToken, isPullRequestList);
}

export function fetchPullRequestDetail(
  getAccessToken: AccessTokenProvider,
  repo: string,
  number: number,
): Promise<PullRequestDetail> {
  const query = new URLSearchParams({ repo });
  return requestJson(
    `/api/github/prs/${number}?${query}`,
    getAccessToken,
    isPullRequestDetail,
  );
}
