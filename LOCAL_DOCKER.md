# Local Docker Setup

Start AuthFoundation first. For Visual Studio debugging, run the backend dependencies from the AuthFoundation repository and start the `AuthFoundation Local` profile.

```powershell
cd D:\portfolio\Auth
docker compose -f docker-compose.local.yml up -d auth-db auth-db-init redis
```

Then run AuthPortal.

```powershell
cd D:\portfolio\_worktrees\authportal-password-reset
docker compose -f docker-compose.local.yml up -d
```

Open:

```text
http://localhost:5700
```

The portal is configured for:

```text
NUXT_PUBLIC_AUTH_API_BASE=http://localhost:5000
NUXT_PUBLIC_AUTH_CLIENT_ID=00000000000000000000000000000000
NUXT_PUBLIC_AUTH_SCOPE=openid profile email
```

If you run AuthFoundation as a Docker container instead of Visual Studio, keep the same browser-facing API URL:

```powershell
cd D:\portfolio\Auth
docker compose -f docker-compose.local.yml --profile api up -d --build
```
