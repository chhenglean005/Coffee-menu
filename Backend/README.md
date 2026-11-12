# Coffee Shop API

Express and Mongoose API for managing the coffee shop menu and dashboard accounts. The React app connects to `http://localhost:5000/api` in local development; set `VITE_API_URL` for the deployed API.

## Requirements and setup

- Node.js 20.13 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

From the `Backend` directory:

```powershell
npm install
Copy-Item .env.example .env
```

Set these values in `.env`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/coffee_shop
FRONTEND_ORIGIN=http://localhost:5173
SESSION_SECRET=<random secret of at least 32 characters>
INITIAL_ADMIN_EMAIL=owner@example.com
INITIAL_ADMIN_PASSWORD=<unique password of at least 12 characters>
```

Generate a session secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For Atlas, replace the local `MONGODB_URI` with your cluster connection string and credentials. The initial administrator is created only when the `users` collection is empty; changing the initial-admin environment values later does not change an existing password. After first startup, remove `INITIAL_ADMIN_PASSWORD` from the environment. Never commit `.env` or share database credentials.

Start the API:

```powershell
npm run dev
```

The server connects to MongoDB before listening on port `5000` (or `PORT` if configured). Use `npm start` for a non-watching process. CORS is restricted to `FRONTEND_ORIGIN`. The API uses an HttpOnly session cookie stored in MongoDB. In production, use HTTPS and set `NODE_ENV=production` so the cookie is secure. If running behind a trusted reverse proxy, set `TRUST_PROXY=1`.

## Deploying the frontend to Netlify

The repository includes a root `netlify.toml` configured to build the Vite app from `Frontend` using `npm run build` and publish `dist`. In Netlify, connect this repository and add this site environment variable:

```text
VITE_API_URL=https://<your-api-host>/api
```

Replace the example URL with the public URL of your deployed backend, then deploy or trigger a new deploy. Vite embeds this value at build time.

The Express API must be deployed separately on a Node.js host that supports a persistent service. Configure its environment variables from `Backend/.env.example`, including:

- `MONGODB_URI` with your production MongoDB connection string.
- `FRONTEND_ORIGIN` with the exact deployed Netlify site origin, such as `https://your-site.netlify.app` (no trailing slash).
- `SESSION_SECRET` with a unique random value of at least 32 characters.
- `NODE_ENV=production`.
- `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` for first startup only. After the first administrator is created, remove `INITIAL_ADMIN_PASSWORD`.
- `SESSION_COOKIE_SAME_SITE=none` when the Netlify site and API use different site domains. `none` requires HTTPS. If both use HTTPS subdomains of your own domain, set it to `lax` instead.

Set the Netlify environment variable to the backend's public URL, not `localhost`. After deployment, check `https://<your-api-host>/api/health`, load the menu, and test staff sign-in. Some browsers restrict third-party cookies between unrelated site domains; using a custom domain with the frontend and API on the same site (for example, `www.example.com` and `api.example.com`) is the most reliable way to keep cross-origin sessions working.

## Deploy both services to Render

The repository root contains a `render.yaml` Blueprint for a Render web service (Express API) and a static site (Vite frontend). To deploy:

1. Push the repository to GitHub and create a new **Blueprint** in Render connected to that repository.
2. When prompted, provide `MONGODB_URI` with your production MongoDB Atlas connection string, plus `INITIAL_ADMIN_EMAIL` and a unique `INITIAL_ADMIN_PASSWORD` of at least 12 characters.
3. Review the service environment values. The Blueprint uses `https://coffee-menu-api.onrender.com/api` for the frontend API URL and `https://coffee-menu-frontend.onrender.com` for the backend CORS origin. If Render assigns different service URLs, update `VITE_API_URL` on the static site and `FRONTEND_ORIGIN` on the API to match the actual URLs exactly, then redeploy both services.
4. Wait for the API health check at `https://<your-api-host>/api/health` to pass, then load the frontend and test staff sign-in.
5. After the first administrator has been created, remove `INITIAL_ADMIN_PASSWORD` from the API environment.

The Blueprint generates `SESSION_SECRET`, sets `NODE_ENV=production`, enables proxy trust for Render's HTTPS proxy, and configures secure cross-origin session cookies. For menu image uploads, also set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` on the API service. Keep MongoDB and Cloudinary credentials in Render's environment settings, never in the frontend or source control. Render's free web service can sleep when idle; the first request after inactivity may take longer.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/menu` | List menu items |
| `GET` | `/api/menu/:id` | Get one menu item |
| `POST` | `/api/menu` | Create a menu item (signed-in staff/admin) |
| `PUT` | `/api/menu/:id` | Update a menu item (signed-in staff/admin) |
| `DELETE` | `/api/menu/:id` | Delete a menu item (signed-in staff/admin) |
| `POST` | `/api/auth/login` | Sign in with email and password |
| `POST` | `/api/auth/logout` | Sign out and clear the session |
| `GET` | `/api/auth/me` | Get the current signed-in user |
| `GET` | `/api/auth/users` | List accounts (admin only) |
| `POST` | `/api/auth/users` | Create a staff account (admin only) |
| `DELETE` | `/api/auth/users/:id` | Remove a staff account (admin only) |
| `GET` | `/api/health` | Check API and database connection status |

Create and update menu requests use `multipart/form-data`. Send text fields `name`, `description`, `price`, `category`, and `available`, plus an optional `image` file. Image uploads accept JPEG, PNG, WebP, and GIF files up to 5 MB. New images are stored in Cloudinary; MongoDB stores each secure delivery URL and Cloudinary asset ID. When updating an item, omit `image` to keep its current image; upload a new file to replace it. `name`, `price`, and `category` are required when creating an item; `available` defaults to `true`. Delete responds with `204 No Content`.

## Configure Cloudinary image storage

1. Create a free account at [cloudinary.com](https://cloudinary.com/) and open the Cloudinary **Console**.
2. Find **Cloud name**, **API Key**, and **API Secret** in the account details or API Keys section.
3. Put those values in `Backend/.env` using the `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` entries from `.env.example`. Set `CLOUDINARY_FOLDER` to change the optional folder used for new menu images.
4. Restart the backend. The admin image picker works as before; the API uploads selected images to Cloudinary and returns a secure image URL for the menu.

Keep the API secret private. Do not put Cloudinary credentials in React/Vite environment variables, commit `.env`, or share credentials in screenshots or chat. Cloudinary performs the image storage; MongoDB stores only the URL and asset ID. Existing local `/uploads/...` images continue to be served by the backend and are removed when they are replaced or their menu items are deleted.

The first account is an administrator. Sign in from the React app using its configured email and password. Administrators can create staff accounts from the dashboard; staff can sign in and manage menu products but cannot manage accounts. Passwords are hashed with bcrypt and are never returned by the API. Login attempts are rate limited.
