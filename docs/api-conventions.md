# Keyrush API Conventions

These rules apply to every HTTP endpoint in the Keyrush server. They are **decisions**, not suggestions: code review checks new endpoints against this document. If a rule needs to change, change it here first, in its own pull request.

Real-time race events (Socket.io) are out of scope for this document.

---

## 1. URLs

| Rule                                          | ✅ Do               | ❌ Don't                                | Why                                                        |
| --------------------------------------------- | ------------------- | --------------------------------------- | ---------------------------------------------------------- |
| Every route starts with `/api`                | `/api/races`        | `/races`                                | Never collides with frontend routes; one proxy rule in dev |
| Plural nouns for collections                  | `/api/races`        | `/api/race`, `/api/raceList`            | One name for both the collection and its items             |
| No verbs in paths                             | `POST /api/races`   | `POST /api/createRace`                  | The HTTP method already says what happens                  |
| Lowercase, kebab-case for multi-word segments | `/api/race-results` | `/api/raceResults`, `/api/race_results` | URLs are case-sensitive; one predictable style             |
| Identify resources by stable IDs              | `/api/users/6ac7…`  | `/api/users/abhinav`                    | Names change; IDs don't                                    |
| No trailing slash, no file extensions         | `/api/races/42`     | `/api/races/42/`, `/api/races/42.json`  | One canonical URL per resource                             |

The logged-in user is the singleton **`/api/users/me`**, resolved from the auth token, never from a client-supplied ID.

## 2. Nesting

- **Nest only for ownership**: when the child cannot exist without the parent.
  `GET /api/races/:raceId/results`: a result always belongs to a race.
- **Maximum depth: one parent** (`/parents/:id/children`). Never deeper.
- **Shallow nesting**: list and create are nested, because they need the parent; item operations are top-level, because the ID is already unique.

```text
GET    /api/races/:raceId/results     list    (nested)
POST   /api/races/:raceId/results     create  (nested)
GET    /api/results/:resultId         item    (top-level)
DELETE /api/results/:resultId         item    (top-level)
```

**Why:** short URLs, and one ID per item route means one authorization check per route.

## 3. Actions that aren't CRUD

Pick the first option that fits:

1. **State change → `PATCH`** with the new state.
   Start a race: `PATCH /api/races/:id` `{ "status": "countdown" }`
2. **Relationship → sub-resource.**
   Join a race: `POST /api/races/:id/participants` · Leave: `DELETE /api/races/:id/participants/me`
3. **Custom action → `POST /resource/:id/<verb>`**, only when the action has significant side effects and isn't a field update. Must be listed in this document before it is built.

The server always decides whether a requested transition is allowed (state machine + permissions). The client only _requests_ it.

**Documented exception, auth:** `POST /api/auth/signup`, `/login`, `/refresh`, `/logout`. These are universally understood, and modelling them as resources would hurt readability.

## 4. Methods

| Method   | Use for                                               | Success code                | Idempotent |
| -------- | ----------------------------------------------------- | --------------------------- | ---------- |
| `GET`    | Read a collection or an item. **Never changes data.** | 200                         | ✅         |
| `POST`   | Create in a collection, or a documented custom action | 201 (create) / 200 (action) | ❌         |
| `PATCH`  | Partial update: only the fields sent change           | 200 + updated resource      | —          |
| `DELETE` | Remove an item                                        | 204, no body                | ✅         |

- **We use `PATCH`, not `PUT`.** Partial updates are what clients actually need, and `PUT` silently wipes omitted fields.
- **`GET` requests never have a body.** Use query params.

## 5. Status codes

| Situation                                                               | Code    | Error `code`                                                |
| ----------------------------------------------------------------------- | ------- | ----------------------------------------------------------- |
| Read or update succeeded                                                | **200** | —                                                           |
| Resource created                                                        | **201** | —                                                           |
| Deleted, nothing to return                                              | **204** | —                                                           |
| Malformed JSON body                                                     | **400** | `INVALID_JSON`                                              |
| Request fails validation (shape, type, format, limits)                  | **400** | `VALIDATION_ERROR`                                          |
| Invalid ID format in the path                                           | **400** | `INVALID_ID`                                                |
| Request body larger than 10 kB                                          | **413** | `PAYLOAD_TOO_LARGE`                                         |
| Missing, invalid or expired token or session                            | **401** | `UNAUTHENTICATED`                                           |
| Wrong email or password                                                 | **401** | `INVALID_CREDENTIALS`                                       |
| Authenticated, but not allowed to do this                               | **403** | `FORBIDDEN`                                                 |
| Resource doesn't exist, or the caller may not know it exists            | **404** | `NOT_FOUND`                                                 |
| Conflicts with current state (duplicate, race full, invalid transition) | **409** | specific, e.g. `EMAIL_TAKEN`, `USERNAME_TAKEN`, `RACE_FULL` |
| Rate limit exceeded                                                     | **429** | `RATE_LIMITED`                                              |
| Unexpected bug                                                          | **500** | `INTERNAL_ERROR`                                            |
| A dependency (DB) is down                                               | **503** | `SERVICE_UNAVAILABLE`                                       |

**Decision: 400 for all validation errors.** We don't use 422. One code for "fix your request" keeps clients simple, and the error `code` + `details` already say exactly what's wrong.

**Decision: 403 vs 404.**

- If the caller **must not learn that the resource exists** (e.g. someone else's private race) → **404**.
- If the caller can see the resource but **can't perform this action** (e.g. a participant tries to start a race they don't host) → **403**.

## 6. Request data

| Data                       | Where         | Example                                     |
| -------------------------- | ------------- | ------------------------------------------- |
| Which resource             | **Path**      | `/api/races/:raceId`                        |
| Filter, sort, search, page | **Query**     | `/api/races?status=waiting&sort=-createdAt` |
| Data to create or update   | **JSON body** | `{ "mode": "code" }`                        |
| Auth token                 | **Header**    | `Authorization: Bearer <token>`             |

- **Validation runs in middleware, before the controller.** Controllers only ever see validated data.
- Every endpoint validates **path params, query and body** with a schema (Zod). A route declares its schemas with `validateRequest({ body, params, query })`; each key is optional.
- **Controllers read `req.validated.body`, `req.validated.params` and `req.validated.query`**, never `req.body`, `req.params` or `req.query` directly. The raw values are unchecked; `req.validated` holds the parsed result. (Express 5 makes `req.query` read-only, so parsed data cannot be written back onto it.)
- If validation fails, the controller is not called and the response is `400 VALIDATION_ERROR` (see §7).
- **Unknown body fields are stripped**, never passed to the database (prevents mass assignment).
- Strings are normalized where it matters (email: trimmed + lowercased).
- Query params arrive as strings and are **coerced** by the schema (`?limit=20` → number).
- JSON bodies are limited to **10 kB**. A larger body is rejected with `413 PAYLOAD_TOO_LARGE`; a body that is not valid JSON is rejected with `400 INVALID_JSON`.
- **Secrets never go in URLs** (tokens, passwords): they end up in logs and browser history.

## 7. Errors

Every error response, from any route, has exactly this shape:

```json
{
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "An account with this email already exists.",
    "details": [{ "field": "email", "message": "Already registered" }],
    "requestId": "6b694e9c-5cbf-4d22-bbca-9fd5bdd68322"
  }
}
```

| Field       | Required | Rules                                                                                                  |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `code`      | ✅       | `SCREAMING_SNAKE_CASE`, **stable**: clients branch on it, so never rename it                           |
| `message`   | ✅       | Human-readable; may change wording at any time                                                         |
| `details`   | Optional | Field-level problems (validation). The key is absent when there are none                               |
| `requestId` | ✅       | The id of this request: the same value as the `X-Request-ID` header and the `requestId` in server logs |

**Validation errors report every problem at once.** `details` has one `{ field, message }` entry per problem, across body, params and query together. `field` is a path a client can match to an input: `email`, or `address.city` for nested values.

**A 500 response must never contain:** stack traces, database or driver error messages, file paths, or internal IDs. It returns `INTERNAL_ERROR` with a generic message; the full error is **logged on the server**.

**No user enumeration:** login failures always return `401 INVALID_CREDENTIALS` with `"Invalid email or password"`, whether the email exists or not.

Errors are created by throwing an `ApiError(statusCode, message, code, details?)` and turned into responses by **one central error-handling middleware**. Controllers never build error JSON by hand. Express 5 forwards errors thrown or rejected inside `async` handlers to that middleware, so routes need no `try/catch` for this.

**Services don't know HTTP.** `ApiError` belongs to the HTTP layer (routes, middleware, controllers). A service reports a known failure by throwing a plain `Error` with a stable `code`, and no status:

```js
const err = new Error("email is already taken");
err.code = "EMAIL_TAKEN";
throw err;
```

The error middleware maps the code to a status with one lookup table, `STATUS_BY_CODE` (`server/src/middleware/errorMiddleware.js`). A code that isn't in the table is treated as unexpected: **500**, logged in full. **Add a code to the table in the same PR that starts throwing it.**

**A service catches an error only to give it a new meaning** (for example MongoDB's duplicate key `11000` becomes `EMAIL_TAKEN`). Every other error is rethrown unchanged (`throw error`), never replaced with a new, vaguer one.

**Client mistakes are not server errors.** Only unexpected errors (the 500 path) log the full error at `error` level. Validation failures, malformed JSON, oversized bodies and other `ApiError`s are recorded only by the request's access log line, at `info` level (see §7.2).

### 7.1 Request IDs

- Every request gets an id the moment it arrives: a UUID from `crypto.randomUUID()`.
- The id is returned on **every** response, success or error, in the **`X-Request-ID`** header. Error bodies repeat it as `error.requestId`.
- **The server always generates its own id.** An `X-Request-ID` sent by the client is user input and is ignored.
- The id is held in `AsyncLocalStorage` for the life of the request. Code that needs it calls `getRequestId()` (`server/src/utils/requestContext.js`); nothing passes `req` around for this. Outside a request it returns `undefined`.

**Why:** a user reports "this request failed, id `6b69…`", and that id finds every log line the request produced.

### 7.2 Logging

All server logs go through one Pino logger (`server/src/config/logger.js`). Never use `console.*` in `server/src`.

- **Format:** JSON lines in production (`NODE_ENV=production`), `pino-pretty` in development. The level comes from `LOG_LEVEL` (default `info`).
- **Every line inside a request carries `requestId`** automatically (Pino `mixin`). Lines outside a request, such as startup, have no `requestId` key.
- **Pass fields as an object first, the message second:** `logger.info({ raceId }, "race started")`. The message is a fixed string; values that change go in fields so they can be filtered.

**Levels**

| Level   | Use for                                                       | Example                           |
| ------- | ------------------------------------------------------------- | --------------------------------- |
| `fatal` | The process is about to exit                                  | Failed to start, forced shutdown  |
| `error` | The server's fault; the app keeps running                     | A 500, a 503, an unexpected error |
| `info`  | Normal work, and client mistakes (they are not server faults) | Startup, 2xx, 400, 404, 413       |
| `debug` | Detail useful only while developing                           | Values inside a function          |

**Access log:** one line per finished request, message `"Request Completed"`, with exactly these fields:

```json
{ "requestId": "6b69…", "method": "GET", "path": "/api/races", "statusCode": 200, "durationMs": 12 }
```

- Level is `error` for `statusCode >= 500`, otherwise `info`.
- `path` never includes the query string, so values like `?token=…` are not logged.
- `GET /api/health` is skipped when it returns 200 (load balancers call it constantly); a 503 is logged.

**Secrets never reach the logs.** Two layers:

1. **Don't log them (the real protection).** Never log request bodies, headers, cookies or query strings. The access log has a fixed list of fields for this reason.
2. **Pino `redact` (the safety net).** If one slips through, these keys are replaced with `[Redacted]`: `password`, `token`, `refreshToken` (top level and one level deep), and `headers.authorization`, `headers.cookie` (top level and one level deep, e.g. `req.headers`). Redaction matches by key name and only to that depth, so it does not replace layer 1. **Add a key to the list in the same PR that introduces it.**

## 8. Authentication & authorization

- **Deny by default.** Every route requires authentication unless it's listed here as public.
- **Public routes:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/health`, `GET /api/leaderboard`. Refresh and logout need no access token; they read the refresh token cookie (§8.2).
- Authentication runs as middleware and sets the current user. **401** if it fails.
- Authorization (ownership, roles, state) is checked **on the server for every request**. **403/404** if it fails (see §5).
- **Never trust identity from the client.** `userId`, `hostId` or `role` in a request body are ignored; they come from the token.
- Hiding a button in the UI is UX, not security.

### 8.1 Signup and stored users

`POST /api/auth/signup` takes `{ username, email, password }` and logs the user in straight away (Keyrush has no email verification). It returns **201** with `{ user, accessToken }`, where `user` is `{ id, username, email, createdAt, updatedAt }`, and sets the refresh token cookie (§8.2).

| Field      | Rules                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------- |
| `username` | Trimmed and lowercased, 3–20 characters, letters, numbers and `_` only. Unique           |
| `email`    | Trimmed and lowercased, valid email. Unique                                              |
| `password` | 8–64 characters. The maximum stops very long inputs from tying up the CPU during hashing |

- Trimming and lowercasing happen **twice on purpose**: in the Zod schema (so validation sees the clean value) and in the Mongoose schema (so every write path is covered, not just HTTP).
- Passwords are hashed with **Argon2id** (`argon2` package) and stored as `passwordHash`. The plain password is never stored, logged or returned.
- **Duplicates are caught by the database**, not by a lookup first. `username` and `email` have unique indexes, so two identical signups at the same moment give one **201** and one **409**, never a 500. MongoDB's error `11000` is mapped using `keyPattern` (the field name), not `keyValue` (the user's data).
- Responses are shaped by the User model's `toJSON` transform (`_id` becomes `id`; `passwordHash` and `__v` are removed). Don't use `.lean()` for anything sent to a client: lean results skip the transform.

### 8.2 Tokens, sessions and cookies

Two JWTs, signed with **two different secrets** (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`), so one can never be accepted as the other and one leak doesn't expose both. Both secrets are validated at startup by `server/src/config/env.js`.

| Token   | Lifetime   | Payload           | Where the client keeps it                            | Sent as                         |
| ------- | ---------- | ----------------- | ---------------------------------------------------- | ------------------------------- |
| Access  | 10 minutes | `{ userId }`      | In memory only, from the JSON body                   | `Authorization: Bearer <token>` |
| Refresh | 7 days     | `{ userId, jti }` | `refreshToken` cookie; page JavaScript can't read it | Cookie, sent by the browser     |

- **A JWT payload is encoded, not encrypted.** Put only ids in it: never email, password data or anything that changes.
- **Access tokens are stateless**: the server checks signature and expiry only. **Refresh tokens are stateful**: each one has a unique `jti`, stored in the `sessions` collection.

**Sessions** (`server/src/models/sessionModel.js`): `{ jti (unique), userId, expireAt }`, one document per logged-in device.

- `expireAt` is taken from the refresh token's own `exp`, converted once in `server/src/utils/token.js` (`exp` is in seconds; JavaScript dates are milliseconds). The session, the token and the cookie therefore always expire at the same moment.
- A TTL index (`expires: 0`) lets MongoDB delete a session when `expireAt` passes. Sessions that are rotated or logged out are deleted straight away; TTL only cleans up devices that never came back.

**Refresh token cookie** (one shared helper in `authController.js`):

| Option     | Value                             | Why                                                              |
| ---------- | --------------------------------- | ---------------------------------------------------------------- |
| `httpOnly` | `true`                            | Page JavaScript (and an XSS payload) can't read it               |
| `secure`   | `true` when `NODE_ENV=production` | Only sent over HTTPS in production; localhost has no HTTPS       |
| `sameSite` | `strict`                          | Not sent on requests started by other sites                      |
| `path`     | `/api/auth`                       | Only sent to the auth routes that need it, not on every API call |
| `expires`  | the token's expiry `Date`         | Same moment as the session                                       |

**`NODE_ENV=production` must be set on deploy.** Without it the cookie isn't marked `Secure`, and the logger falls back to `pino-pretty`, which isn't installed in production.

### 8.3 Login, refresh and logout

**Login** (`POST /api/auth/login`, body `{ email, password }`):

- Its own Zod schema: email trimmed and lowercased; password capped at 64 characters, **no minimum** (login checks a password, it doesn't enforce the signup policy, so changing that policy can't lock out existing users). Without a schema, a body like `{ "email": { "$ne": null } }` would turn the lookup into "any user" (NoSQL injection); now it's a 400.
- Unknown email and wrong password give the same **401 `INVALID_CREDENTIALS`**, `"Invalid email or password"`, **and take the same time**: when the email isn't found, the password is still verified against a dummy Argon2id hash created at startup with the same settings (`server/src/utils/password.js`). Measured median of 25: unknown email 63.7 ms, wrong password 62.7 ms; without the dummy hash an unknown email returned in 2.4 ms.
- Returns **200** `{ user, accessToken }` and sets the refresh token cookie.

**Refresh** (`POST /api/auth/refresh`, no body): the browser sends the cookie; the response is **200** `{ accessToken }` plus a new cookie.

1. The cookie is cleared first, so any failure leaves the client with no stale cookie.
2. The token is verified with the refresh secret, and its `jti` is found **and deleted in one step** (`findOneAndDelete`), so two refreshes racing with the same token can't both succeed.
3. A new access token, refresh token and session are issued.

**Rotation:** every refresh token works **once**. Reusing an old one (for example a stolen copy) returns 401. Every failure (no cookie, bad signature, expired, unknown or already-used `jti`) returns the same **401 `UNAUTHENTICATED`**, `"Your session has expired. Please log in again."`, without saying which one, and the client should send the user to log in.

**Logout** (`POST /api/auth/logout`): clears the cookie and deletes that device's session. It is **idempotent and always returns 204**: no cookie, an invalid token or an already-deleted session all mean "this device is logged out". The token is verified before its `jti` is used, so a forged token can't log someone else out. A database failure is not swallowed: it returns 500.

## 9. Naming & formats

| Item              | Convention                  | Example                      |
| ----------------- | --------------------------- | ---------------------------- |
| JSON fields       | `camelCase`                 | `createdAt`, `wpmBest`       |
| Resource ID field | `id` (string), never `_id`  | `"id": "6ac726e0b08b…"`      |
| Dates & times     | ISO 8601 strings in **UTC** | `"2026-10-08T05:15:12.162Z"` |
| Enum values       | lowercase strings           | `"status": "waiting"`        |
| Booleans          | `is` / `has` prefix         | `isPrivate`, `hasFinished`   |
| Error codes       | `SCREAMING_SNAKE_CASE`      | `RACE_FULL`                  |

Sensitive fields (`password`, password hashes, internal flags) are **never** returned.

## 10. Endpoint catalogue

```text
HEALTH
  GET    /api/health                          public      200 | 503

AUTH (documented exception, §3)
  POST   /api/auth/signup                     public      201 | 400 | 409 EMAIL_TAKEN / USERNAME_TAKEN | 429
  POST   /api/auth/login                      public      200 | 400 | 401 INVALID_CREDENTIALS | 429
  POST   /api/auth/refresh                    cookie      200 | 401 UNAUTHENTICATED
  POST   /api/auth/logout                     cookie      204

USERS
  GET    /api/users/me                        auth        200 | 401
  PATCH  /api/users/me                        auth        200 | 400 | 401
  GET    /api/users/me/stats                  auth        200 | 401
  GET    /api/users/:userId                   auth        200 | 401 | 404

RACES
  GET    /api/races?status=waiting            auth        200 | 400 | 401
  POST   /api/races                           auth        201 | 400 | 401
  GET    /api/races/:raceId                   auth        200 | 401 | 404
  PATCH  /api/races/:raceId                   auth+host   200 | 400 | 401 | 403 | 404 | 409
  DELETE /api/races/:raceId                   auth+host   204 | 401 | 403 | 404
  POST   /api/races/:raceId/participants      auth        201 | 401 | 404 | 409 RACE_FULL / ALREADY_JOINED
  DELETE /api/races/:raceId/participants/me   auth        204 | 401 | 404
  GET    /api/races/:raceId/results           auth        200 | 401 | 404

PASSAGES
  GET    /api/passages?mode=code              auth        200 | 400 | 401

LEADERBOARD
  GET    /api/leaderboard?period=daily        public      200 | 400
```

## 11. To be decided

These will be added as they're designed. Until then, raise them in the PR that first needs them.

- **Pagination:** offset vs cursor, default and maximum page size, response format
- **Filtering & sorting:** query syntax (`sort=-createdAt`), allowed fields
- **Response envelope:** bare resources vs `{ "data": ... }`, list metadata
- **Idempotency:** `Idempotency-Key` for non-idempotent POSTs
- **Versioning:** `/api/v1` or not
- **Rate limiting:** limits per route group, `Retry-After` header
- **Caching:** `Cache-Control` / `ETag` for public reads (leaderboard)
