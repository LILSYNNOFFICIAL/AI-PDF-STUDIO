# AI PDF Studio Deployment

## Frontend: GitHub Pages

The frontend is a Vite application. GitHub Pages must publish the compiled `dist` directory, not the repository source tree.

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Merge the deployment workflow into `main`. The workflow runs tests and type checks, builds Vite with `VITE_BASE_PATH=/AI-PDF-STUDIO/`, verifies the compiled assets, and deploys `dist`.
4. After the API service is created on Render, add a repository Actions variable named `VITE_API_BASE_URL` with the exact HTTPS origin shown on the Render service page, for example `https://your-service-name.onrender.com`. Do not include `/api` at the end. Re-run the Pages workflow after setting the variable.

The production HTML must reference compiled assets beneath `/AI-PDF-STUDIO/`. It must not reference `/src/main.tsx`.

## Backend: Render

The repository includes `render.yaml` for the existing Express API.

1. In Render, choose **New → Blueprint** and connect this repository.
2. Select the branch containing the deployment configuration. When the changes are merged to `main`, use `main` for the production service.
3. Review the `ai-pdf-studio-api` web service. It uses the Bun runtime, runs `bun install --frozen-lockfile && bun run lint && bun run test`, and starts with `bun run start`.
4. Enter `GEMINI_API_KEY` in the Render service's Environment page. The value is a secret and must never be added to repository files or Vite variables.
5. Confirm `ALLOWED_ORIGINS` includes `https://lilsynnofficial.github.io`. Origins contain no path suffix.
6. Wait for Render to report the service as Live. Verify `https://<render-service-host>/api/health` returns `status: "ok"` and `geminiConfigured: true`.
7. Copy the service's HTTPS origin into the GitHub Actions repository variable `VITE_API_BASE_URL`, then rebuild and deploy the Pages frontend.

## Local development

- Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
- Set `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173` when using the Vite development server.
- Run `bun install`, then `bun run dev`.
- For a production Pages-path build, run `VITE_BASE_PATH=/AI-PDF-STUDIO/ bun run build`.

## Important runtime boundaries

GitHub Pages serves static files only. It cannot run Express routes. The browser calls the separate Render API through `VITE_API_BASE_URL`. If the API is unreachable, missing its key, or rejects an operation, the UI reports the error and leaves the current document unchanged.

The API currently accepts JSON requests up to 20 MB. AI requests are split into bounded section chunks. A single section larger than the configured safe chunk limit is rejected with an explicit error rather than silently truncated. Split very large sections into smaller clauses/content blocks before retrying.

Render free web services may spin down after inactivity. The first request after an idle period can take longer while the service starts.
