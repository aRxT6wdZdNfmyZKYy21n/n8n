# ldap-sync

External service that syncs users and group membership from Active Directory (or any LDAP) into n8n. It uses n8n's existing REST API: creates users via invitations, lists users, and sets a **block flag** (`ldapBlocked` in user settings) so that users who have lost AD group membership cannot log in.

## Behaviour

- **Periodically** (configurable interval):
  - Connects to AD/LDAP and reads users in configured groups.
  - Maps each AD group to an n8n global role (e.g. `global:member`, `global:admin`).
  - Compares with current n8n users (by email):
    - **New user in AD** → create in n8n via invitation API (email + role). Invite email is sent unless disabled.
    - **User in n8n but no longer in any allowed AD group** → set `ldapBlocked: true` (login rejected in n8n).
    - **User regained group** → set `ldapBlocked: false`.

- n8n **does not** perform LDAP auth itself; users log in with email + password (set via invite or by owner). This service only keeps n8n user list and block state in sync with AD.

## Requirements

- Python 3.10+
- n8n instance with **owner** account (for API auth).
- LDAP/AD reachable from the host running ldap-sync.

## Configuration

Copy `.env.example` to `.env` and set:

- **N8N_BASE_URL** – e.g. `http://n8n:5678`
- **N8N_REST_PREFIX** – usually `/rest`
- **N8N_OWNER_EMAIL** / **N8N_OWNER_PASSWORD** – owner credentials; ldap-sync logs in and uses the session cookie for API calls.
- **LDAP_*** – LDAP server URL, bind DN/password, base DN, group filters (see `.env.example`).
- **GROUP_ROLE_MAP** – JSON mapping AD group names to n8n roles, e.g. `{"n8n-users": "global:member", "n8n-admins": "global:admin"}`.
- **SYNC_INTERVAL_SECONDS** – how often to run the sync (default 300).

## Running

### Local

```bash
cd tools/ldap-sync
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

- Health: `GET http://localhost:8080/health`
- Trigger sync once: `POST http://localhost:8080/sync` (optional; sync also runs on a timer).

### Docker

```bash
cd tools/ldap-sync
docker build -t ldap-sync .
docker run --env-file .env ldap-sync
```

### docker-compose (next to n8n)

Add to your compose file:

```yaml
  ldap-sync:
    build: ./tools/ldap-sync
    env_file: ./tools/ldap-sync/.env
    restart: unless-stopped
```

## n8n API used

- `POST /rest/login` – obtain session cookie (owner email/password).
- `GET /rest/users` – list users (to diff with AD).
- `POST /rest/invitations` – create users (body: `[{ "email": "...", "role": "global:member" }]`). Sends invite email unless you configure n8n to skip it.
- `PATCH /rest/users/:id/settings` – set `{ "ldapBlocked": true }` or `{ "ldapBlocked": false }`.

All under the same base URL and `/rest` prefix; auth is session cookie after login.
