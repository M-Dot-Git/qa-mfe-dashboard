# qa-mfe-dashboard

Independent React dashboard remote on port 3001. It exposes `./App` in
`/assets/remoteEntry.js` through the documented Vite ESM federation contract.
The shell supplies a typed `getAccessToken` prop; the remote uses it to request
authorized dashboard data from the QA Insights API. When run by itself without
that provider, the dashboard explains that it must be opened through the shell.

The local API endpoint is `/api/qa/dashboard`; the shell proxies API requests
to port 8000. Run `npm install`, `npm test`, and `npm run build` here.
