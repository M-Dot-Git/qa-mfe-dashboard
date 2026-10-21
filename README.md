# qa-mfe-dashboard

Independent React dashboard remote on port 3001. It exposes `./App` in
`/assets/remoteEntry.js` through the documented Vite ESM federation contract.
The initial screen intentionally shows API-unavailable/empty states rather than
inventing QA measurements.

Set `VITE_API_BASE_URL` when an API is available. No endpoint or response
contract was verified; connect data only after confirming the API's OpenAPI
specification. Run `npm install`, `npm test`, and `npm run build` here.
