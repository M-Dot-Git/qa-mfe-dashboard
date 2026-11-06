# qa-mfe-dashboard

Independent React dashboard remote on port 3001. It exposes `./App` in
`/assets/remoteEntry.js` through the documented Vite ESM federation contract.
The shell supplies a typed `getAccessToken` prop; the remote uses it to request
authorized dashboard data from the QA Insights API. When run by itself without
that provider, the dashboard explains that it must be opened through the shell.

The dashboard uses the shell's React Router context for nested workspace
navigation:

| Route | View |
| --- | --- |
| `/dashboard` | Workspace cards |
| `/dashboard/overview` | Existing QA metrics |
| `/dashboard/test-reports/*` | Test Reports MFE |
| `/dashboard/github` | Cursor-paginated pull requests |
| `/dashboard/github/prs/:number?repo=owner/repo` | Pull request detail |

Test Reports is loaded as a nested federation remote only when selected; it is
not registered in `qa-mfe-shell`. It receives the same access-token provider
and calls `/api/test-reports/*` through `qa-insights-api`. For standalone
development, `src/main.tsx` provides the `/dashboard/*` route wrapper.

The local API endpoint is `/api/qa/dashboard`; the shell proxies API requests
to port 8000. Set `VITE_TEST_REPORTS_REMOTE_URL` when the report remote is not
served at its local default on port 3005. Run `npm install`, `npm test`, and
`npm run build` here.
