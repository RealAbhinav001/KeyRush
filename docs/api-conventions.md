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

| Situation                                                               | Code    | Error `code`                              |
| ----------------------------------------------------------------------- | ------- | ----------------------------------------- |
| Read or update succeeded                                                | **200** | —                                         |
| Resource created                                                        | **201** | —                                         |
| Deleted, nothing to return                                              | **204** | —                                         |
| Malformed JSON body                                                     | **400** | `INVALID_JSON`                            |
| Request fails validation (shape, type, format, limits)                  | **400** | `VALIDATION_ERROR`                        |
| Invalid ID format in the path                                           | **400** | `INVALID_ID`                              |
| Request body larger than 10 kB                                          | **413** | `PAYLOAD_TOO_LARGE`                       |
| Missing, invalid or expired token                                       | **401** | `UNAUTHENTICATED` / `TOKEN_EXPIRED`       |
| Wrong email or password                                                 | **401** | `INVALID_CREDENTIALS`                     |
| Authenticated, but not allowed to do this                               | **403** | `FORBIDDEN`                               |
| Resource doesn't exist, or the caller may not know it exists            | **404** | `NOT_FOUND`                               |
| Conflicts with current state (duplicate, race full, invalid transition) | **409** | specific, e.g. `EMAIL_TAKEN`, `RACE_FULL` |
| Rate limit exceeded                                                     | **429** | `RATE_LIMITED`                            |
| Unexpected bug                                                          | **500** | `INTERNAL_ERROR`                          |
| A dependency (DB) is down                                               | **503** | `SERVICE_UNAVAILABLE`                     |

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
- Every endpoint validates **path params, query and body** with a schema (Zod).
- **Unknown body fields are stripped**, never passed to the database (prevents mass assignment).
- Strings are normalized where it matters (email: trimmed + lowercased).
- Query params arrive as strings and are **coerced** by the schema (`?limit=20` → number).
- JSON bodies are limited to **10 kB**.
- **Secrets never go in URLs** (tokens, passwords): they end up in logs and browser history.

## 7. Errors

Every error response, from any route, has exactly this shape:

```json
{
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "An account with this email already exists.",
    "details": [{ "field": "email", "message": "Already registered" }],
    "requestId": "a1b2c3d4"
  }
}
```

| Field       | Required | Rules                                                                        |
| ----------- | -------- | ---------------------------------------------------------------------------- |
| `code`      | ✅       | `SCREAMING_SNAKE_CASE`, **stable**: clients branch on it, so never rename it |
| `message`   | ✅       | Human-readable; may change wording at any time                               |
| `details`   | Optional | Field-level problems (validation)                                            |
| `requestId` | Optional | Correlates a response with server logs                                       |

**A 500 response must never contain:** stack traces, database or driver error messages, file paths, or internal IDs. It returns `INTERNAL_ERROR` with a generic message; the full error is **logged on the server**.

**No user enumeration:** login failures always return `401 INVALID_CREDENTIALS` with `"Invalid email or password"`, whether the email exists or not.

Errors are created by throwing an `ApiError` and turned into responses by **one central error-handling middleware**. Controllers never build error JSON by hand.

## 8. Authentication & authorization

- **Deny by default.** Every route requires authentication unless it's listed here as public.
- **Public routes:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/health`, `GET /api/leaderboard`.
- Authentication runs as middleware and sets the current user. **401** if it fails.
- Authorization (ownership, roles, state) is checked **on the server for every request**. **403/404** if it fails (see §5).
- **Never trust identity from the client.** `userId`, `hostId` or `role` in a request body are ignored; they come from the token.
- Hiding a button in the UI is UX, not security.

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
  POST   /api/auth/signup                     public      201 | 400 | 409 EMAIL_TAKEN | 429
  POST   /api/auth/login                      public      200 | 400 | 401 INVALID_CREDENTIALS | 429
  POST   /api/auth/refresh                    public      200 | 401
  POST   /api/auth/logout                     auth        204

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
