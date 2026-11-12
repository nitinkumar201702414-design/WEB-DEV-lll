# TeamSync

A secure, real-time team collaboration and project management app.
**React + Vite + Tailwind** frontend, **Express + MongoDB (Mongoose) + Socket.IO** backend.

## What it demonstrates

| Concept | Where to look |
|---|---|
| Environment variables | `server/.env`, `server/src/config/config.js` |
| Express REST API + MVC | `server/src/routes`, `controllers`, `models`, `services` |
| bcrypt password hashing | `server/src/models/User.js` (pre-save hook) |
| JWT access + refresh tokens, rotation, revocation | `utils/tokens.js`, `controllers/authController.js` |
| Protected routes + RBAC | `middleware/auth.js` (`protect`, `authorize`) |
| EventEmitter | `events/eventEmitter.js`, `events/listeners.js` |
| Socket.IO (JWT auth, rooms, typing, presence) | `socket/socketServer.js`, `client/src/context/RealtimeContext.jsx` |
| Central error handling, validation, pagination | `middleware/errorHandler.js`, `utils/validate.js` |

## Requirements

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## Setup

```bash
# 1) Backend
cd server
npm install
cp .env.example .env        # then edit the two secrets (see the comment in the file)
npm run seed                # sample users, projects, tasks (wipes the DB!)
npm run dev                 # http://localhost:5000

# 2) Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173. In development Vite proxies `/api` and `/socket.io` to port 5000, so the
refresh-token cookie works without any extra CORS setup.

## Seed accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@teamsync.com | Admin@123 |
| User | alice@teamsync.com | User@1234 |
| User | bob@teamsync.com | User@1234 |
| User | carol@teamsync.com | User@1234 |

**Try the real-time features:** open two browsers (or one normal + one private window), log in as admin and as alice,
then (a) assign alice a task as admin - her bell updates instantly, (b) chat in "Website Redesign" from both windows.

## How authentication works

1. **Login/register** returns a short-lived *access token* (15 min) in the JSON body and sets a long-lived *refresh token* (7 days) in an **HttpOnly cookie**.
2. The frontend keeps the access token **in memory only** (never localStorage) and sends it as `Authorization: Bearer ...`.
3. When an API call returns 401, the Axios interceptor calls `POST /api/auth/refresh`, gets a new access token and retries.
4. **Rotation:** every refresh issues a *new* refresh token and invalidates the old one. The database stores only SHA-256 hashes of refresh tokens.
5. **Reuse detection:** if an already-used refresh token shows up again, all sessions of that user are revoked.
6. **Logout** removes the token hash and clears the cookie.

## Business rules (all enforced on the backend)

- Public registration always creates role `user`. Only admins can create admins or change roles (`/api/users`).
- Project names are unique. The creator is automatically a member. Only registered users can be members.
- Tasks can only be assigned to members of the task's project; deadlines cannot be in the past when creating.
- A user can only change the **status** of tasks assigned to them (`PATCH /api/tasks/:id/status`). Everything else is admin-only.
- Deleting a project deletes its tasks and chat messages. A member who still has tasks cannot be removed.
- Project progress = completed tasks / total tasks, calculated live.
- Chat: the socket must present a valid JWT; joining a room and *every message* re-checks project membership.

## API reference

All responses look like `{ "success": true, "data": ... }` or `{ "success": false, "message": "..." }`.
Lists include `pagination: { page, limit, total, pages }`. Auth header: `Authorization: Bearer <accessToken>`.

### Auth (`/api/auth`)
| Method | Path | Access | Body |
|---|---|---|---|
| POST | /register | public | name, email, password, confirmPassword |
| POST | /login | public | email, password |
| POST | /refresh | cookie | - |
| POST | /logout | cookie | - |

### Users (`/api/users`)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /me | any | own profile |
| PATCH | /me | any | name, profilePicture (email/role rejected) |
| PATCH | /me/password | any | currentPassword, newPassword, confirmPassword |
| GET | / | admin | ?search=&role=&page=&limit= |
| POST | / | admin | name, email, password, role |
| PATCH | /:id/role | admin | role: admin or user |

### Projects (`/api/projects`)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | any | admin: all, user: own projects. ?search=&status=&page=&limit= |
| POST | / | admin | name, description, startDate, endDate, status, members[] |
| GET | /:id | admin or member | includes `progress` and `taskCounts` |
| PATCH | /:id | admin | name, description, status, startDate, endDate |
| DELETE | /:id | admin | cascades to tasks and messages |
| POST | /:id/members | admin | userId |
| DELETE | /:id/members/:userId | admin | |

### Tasks (`/api/tasks`)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | / | any | admin: all, user: assigned to me. ?status=&priority=&search=&project=&sort=deadline or -deadline&page=&limit= |
| POST | / | admin | title, description, project, assignedTo, priority, status, deadline |
| GET | /:id | admin or assignee | |
| PATCH | /:id | admin | title, description, priority, status, deadline, assignedTo |
| PATCH | /:id/status | admin or assignee | status only |
| DELETE | /:id | admin | |

### Notifications, Messages, Dashboard
| Method | Path | Access |
|---|---|---|
| GET | /api/notifications | own, ?unread=true |
| GET | /api/notifications/unread-count | own |
| PATCH | /api/notifications/read-all | own |
| PATCH | /api/notifications/:id/read | own |
| GET | /api/messages/:projectId | project members |
| GET | /api/dashboard | admin stats or user stats |

### Socket.IO events
Connect with `io(url, { auth: { token: accessToken } })`.

| Direction | Event | Payload |
|---|---|---|
| client -> server | `project:join` | projectId (ack: `{ok}`) |
| client -> server | `message:send` | `{ projectId, message }` (ack: `{ok}`) |
| client -> server | `typing` | `{ projectId, isTyping }` |
| client -> server | `presence:get` | ack: array of online user ids |
| server -> client | `message:new` | message with `sender.name` |
| server -> client | `typing` | `{ projectId, userId, name, isTyping }` |
| server -> client | `presence:update` | `{ userId, online }` |
| server -> client | `notification:new` | notification document |

### Event flow example (task assignment)
`POST /api/tasks` saves the task -> controller emits `taskAssigned` -> listener in `events/listeners.js` creates a
Notification in MongoDB -> `notificationService` pushes it to the room `user:<id>` -> the bell updates without a page refresh.

## Testing the API

Open `docs/api-tests.http` in VS Code (REST Client or Thunder Client import) or copy the requests into Postman.

## Common errors

| Problem | Fix |
|---|---|
| `Missing environment variable` | Create `server/.env` from `.env.example` |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running - start it or use an Atlas URI |
| `bcrypt` fails to install | Use Node 18/20 LTS and run `npm install` again (or swap to `bcryptjs`) |
| Logged out on every page refresh | Run frontend through Vite (port 5173), not by opening files directly; check `CLIENT_URL` |
| CORS error in production | Set `CLIENT_URL` to your exact frontend URL, `VITE_API_URL`/`VITE_SOCKET_URL` in the client |
| 401 on everything | Access token expired and refresh failed - log in again |
| 403 from an API call | Your role or project membership doesn't allow that action |
| Chat says "not a member" | Add the user to the project (admin > Project > Members) |

## Deployment notes

Set `NODE_ENV=production` (enables `Secure` + `SameSite=None` cookies, which require HTTPS), strong secrets, `CLIENT_URL`
on the server and `VITE_API_URL` / `VITE_SOCKET_URL` in the client build (`npm run build`).
