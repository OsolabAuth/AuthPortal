# AuthPortal Screen Test Scenarios

This document defines screen-first scenarios for reverse engineering AuthPortal requirements.
Do not treat implementation code as the source of truth. Treat the browser behavior, network calls, and user-visible messages as observations, then update the inferred specification after each run.

## Test Method

For each scenario:

1. Open the target screen in a fresh browser context when possible.
2. Execute only user-visible operations.
3. Record the visible result, network status, response body summary, cookies, and storage changes.
4. Compare the observation with the expected behavior.
5. Update the inferred requirement when the observed behavior is intentional, or create a defect ticket when it is not.

Recommended environments:

- Production portal: `https://portal.osolab-auth.jp`
- Production API: `https://auth.osolab-auth.jp`
- Local portal: `http://127.0.0.1:5700`

## Requirement Hypotheses

| ID | Requirement hypothesis |
| --- | --- |
| REQ-PORTAL-001 | The portal supports OIDC Authorization Code + PKCE login with state and nonce protection. |
| REQ-PORTAL-002 | A user can create an account only after email verification, profile input, and terms consent. |
| REQ-PORTAL-003 | Email-code send operations must not allow repeated submissions while the previous request is in flight. |
| REQ-PORTAL-004 | Backend email-code endpoints must rate-limit repeated sends and return a user-visible error. |
| REQ-PORTAL-005 | Password reset requires login email, birth date, latest email code, and matching new password confirmation. |
| REQ-PORTAL-006 | Password change and withdrawal require a recent step-up token. |
| REQ-PORTAL-007 | My page requires an access token and displays user information from UserInfo. |
| REQ-PORTAL-008 | Logout clears local portal tokens and calls the API logout endpoint. |
| REQ-PORTAL-009 | AI agent management requires a step-up token for agent creation, secret issue, and revoke operations. |
| REQ-PORTAL-010 | Health and audit screens must either work against deployed API endpoints or be hidden until supported. |

## Scenario Format

Use this result block while executing:

```text
Run date:
Environment:
Browser:
Account:
Observed UI:
Network calls:
Cookies/storage:
Result: Pass / Fail / Inconclusive
Inferred spec update:
Ticket:
```

## S001 OIDC Login Start

Target requirement: `REQ-PORTAL-001`

Preconditions:

- Portal is open at `/`.
- The browser has no stale `code_verifier`, `state`, `nonce`, `auth_access_token`, or `auth_id_token` in session storage.
- The configured client is registered in AuthFoundation.

Steps:

1. Open `/`.
2. Click `Login with OsolabAuth`.
3. Observe the network request to `/authorize`.
4. Observe the redirect target.

Expected observations:

- The page sends `response_type=code`.
- The page sends `code_challenge_method=S256`.
- The page sends non-empty `state` and `nonce`.
- `code_verifier`, `state`, and `nonce` are stored in session storage before redirect.
- On success, browser navigates to the authorization login screen.
- On invalid client or redirect URI, the page shows the API error and does not navigate.

Reverse-engineered spec:

- Portal is an OAuth/OIDC public client.
- PKCE is mandatory.
- State is mandatory.
- Nonce is mandatory for ID token validation.

## S002 OIDC Callback Token Exchange

Target requirement: `REQ-PORTAL-001`

Preconditions:

- `code_verifier`, `state`, and `nonce` exist in session storage from `S001`.
- The callback URL contains `code` and matching `state`.

Steps:

1. Complete the authorization login.
2. Let the browser return to `/callback?code=...&state=...`.
3. Observe the visible status.
4. Observe the network request to `/token`.
5. Open `/me`.

Expected observations:

- Callback automatically exchanges the code without an extra button click.
- Callback validates the returned `state`.
- Callback validates the ID token `nonce`.
- Access token and ID token are stored in session storage.
- Raw token values are not displayed in full.
- `/me` loads user profile successfully after callback.

Reverse-engineered spec:

- Token exchange is automatic after callback.
- Token storage is session-scoped, not persistent browser storage.

## S003 Callback Rejects State Mismatch

Target requirement: `REQ-PORTAL-001`

Preconditions:

- A stale or different `state` exists in session storage.

Steps:

1. Open `/callback?code=dummy&state=unexpected`.
2. Observe the status and network requests.

Expected observations:

- The screen shows `state mismatch`.
- No `/token` request is sent.
- Retry is disabled or cannot succeed until state is corrected.

Reverse-engineered spec:

- State mismatch is a client-side hard stop.

## S004 Account Signup Happy Path

Target requirements: `REQ-PORTAL-002`, `REQ-PORTAL-003`, `REQ-PORTAL-004`

Preconditions:

- Use an email address that is not registered.
- Mailbox is accessible, or the API is running in Development and the email code can be read from application logs.
- Current terms endpoint is available.

Steps:

1. Open `/signup`.
2. Confirm the current terms are displayed.
3. Enter email.
4. Click `Send verification code`.
5. While the request is pending, click the button repeatedly.
6. Enter the latest email code.
7. Click `Verify email`.
8. Enter password, name, and birth date.
9. Check terms consent.
10. Click `Create account`.

Expected observations:

- Send button is disabled while the send request is pending.
- Only one network request is emitted for one user action.
- If repeated after the request completes too quickly, the backend returns rate-limit behavior instead of sending unlimited emails.
- Account creation is blocked until terms are checked.
- Account creation succeeds only after email verification.
- Success message includes created account information without exposing secrets.

Reverse-engineered spec:

- Signup is a three-step flow: email challenge, email verification, account creation.
- Terms consent is mandatory and must be enforced by API.
- Birth date and name are mandatory profile fields.

## S005 Signup Repeated Email Send

Target requirements: `REQ-PORTAL-003`, `REQ-PORTAL-004`

Preconditions:

- Open `/signup`.
- Enter a valid email address.

Steps:

1. Click `Send verification code`.
2. Immediately click it again if possible.
3. After the first request completes, click it again within the cooldown window.
4. Check mailbox.

Expected observations:

- During the first request, the button is disabled.
- A second click during the request does not create a second request.
- A repeated request within the cooldown window returns a visible `slow_down` or equivalent error.
- Mailbox does not receive unlimited codes.

Reverse-engineered spec:

- Duplicate prevention is required at both UI and API levels.

## S006 Password Reset Happy Path

Target requirement: `REQ-PORTAL-005`

Preconditions:

- A registered user exists.
- User has a stored birth date.
- Mailbox is accessible, or the API is running in Development and the email code can be read from application logs.

Steps:

1. Open `/password/reset`.
2. Enter login email and birth date.
3. Click `Send email code`.
4. Confirm code entry and password fields become enabled.
5. Enter latest email code.
6. Enter new password and matching confirmation.
7. Click `Reset password`.
8. Open `/login`.
9. Log in with the new password.

Expected observations:

- Send button is disabled while the send request is pending.
- Email code, new password, and confirmation fields are disabled until the reset challenge starts.
- Password reset is blocked when confirmation does not match.
- Password reset succeeds with the latest valid email code.
- Login succeeds with the new password.

Reverse-engineered spec:

- Password reset is identity-checked by email and birth date before sending a reset code.
- The visible response must not reveal whether email or birth date matched.

## S007 Password Reset Repeated Email Send

Target requirements: `REQ-PORTAL-003`, `REQ-PORTAL-004`, `REQ-PORTAL-005`

Preconditions:

- Open `/password/reset`.
- Enter a registered email and matching birth date.

Steps:

1. Click `Send email code`.
2. Attempt repeated clicks while pending.
3. Click again within the cooldown window.
4. Check mailbox.

Expected observations:

- The button is disabled while pending.
- Repeated requests within cooldown are rejected or do not send additional emails.
- The screen clearly tells the user to use the latest valid code when a new code is issued.

Reverse-engineered spec:

- Password reset email sends follow the same duplicate-control policy as signup.

## S008 Login Form

Target requirement: `REQ-PORTAL-001`

Preconditions:

- User has a registered account.
- `/authorize` has redirected the browser to the login screen.

Steps:

1. Enter login email and password.
2. Click `Continue`.
3. Observe network request to `/login`.
4. Observe redirect.

Expected observations:

- Login form posts `application/x-www-form-urlencoded`.
- Browser includes cookies.
- On success, browser follows `redirect_url`.
- On wrong password, the screen shows an error and does not redirect.

Reverse-engineered spec:

- Login screen is tied to an authorization session cookie.
- Login outside an authorization session may authenticate but cannot complete authorization.

## S009 My Page Requires Token

Target requirement: `REQ-PORTAL-007`

Preconditions:

- Browser has no `auth_access_token` in session storage.

Steps:

1. Open `/me`.
2. Observe visible message.
3. Log in via OIDC.
4. Return to `/me`.

Expected observations:

- Without token, page shows `login is required`.
- With token, page calls `/userinfo`.
- Profile displays subject, email, and name.
- If `/userinfo` rejects the token, local tokens are cleared.

Reverse-engineered spec:

- My page is a token-backed RP page.
- UserInfo is the source of profile display.

## S010 MFA Email Step-up

Target requirements: `REQ-PORTAL-003`, `REQ-PORTAL-004`, `REQ-PORTAL-006`

Preconditions:

- Registered user exists.
- Mailbox is accessible, or the API is running in Development and the email code can be read from application logs.

Steps:

1. Open `/mfa`.
2. Enter email.
3. Click `Send email code`.
4. Attempt repeated clicks while pending.
5. Enter latest code.
6. Click `Verify email code`.

Expected observations:

- Send button is disabled while pending.
- Repeated sends are rate-limited by API.
- Successful verification displays a step-up token.
- Step-up token is short-lived.

Reverse-engineered spec:

- Email MFA issues a temporary step-up token.
- Step-up token is required by protected account operations.

## S011 Password Change Requires Step-up

Target requirement: `REQ-PORTAL-006`

Preconditions:

- Registered user exists.
- Current password is known.
- A recent step-up token was obtained from `S010`.

Steps:

1. Open `/password/change`.
2. Submit without step-up token.
3. Submit with expired or invalid step-up token.
4. Submit with valid step-up token.
5. Log out.
6. Log in with the new password.

Expected observations:

- Missing or invalid step-up token is rejected.
- Valid step-up token allows password change.
- Login works only with the new password after success.

Reverse-engineered spec:

- Password change is protected by current password and recent step-up authorization.

## S012 Account Withdrawal Requires Step-up

Target requirement: `REQ-PORTAL-006`

Preconditions:

- Disposable registered test user exists.
- A recent step-up token was obtained from `S010`.

Steps:

1. Open `/account/withdrawal`.
2. Submit without step-up token.
3. Submit with invalid step-up token.
4. Submit with valid step-up token.
5. Attempt login again.

Expected observations:

- Missing or invalid step-up token is rejected.
- Valid step-up token deletes or disables the account.
- Login no longer succeeds after withdrawal.

Reverse-engineered spec:

- Withdrawal is a high-risk operation and requires step-up authorization.

## S013 Logout

Target requirement: `REQ-PORTAL-008`

Preconditions:

- Browser has completed OIDC login.
- `auth_access_token` and `auth_id_token` exist in session storage.

Steps:

1. Open `/logout`.
2. Observe network request to `/logout`.
3. Open `/me`.

Expected observations:

- Portal clears session storage tokens.
- API logout is called with credentials.
- `/me` requires login after logout.

Reverse-engineered spec:

- Portal logout is both local token cleanup and API session logout.

## S014 AI Agent Creation

Target requirement: `REQ-PORTAL-009`

Preconditions:

- Registered user exists.
- A recent step-up token was obtained from `S010`.

Steps:

1. Open `/agent`.
2. Enter agent name, client ID, scopes, expiry, and step-up token.
3. Create agent.
4. Observe returned agent ID and secret.

Expected observations:

- Agent creation requires step-up token.
- Agent secret is displayed only immediately after issue.
- The screen should avoid showing raw access tokens unless explicitly inspecting.

Reverse-engineered spec:

- Agent credentials are user-delegated and protected by step-up.

## S015 AI Agent Token Issue

Target requirement: `REQ-PORTAL-009`

Preconditions:

- Agent ID and agent secret exist from `S014`.

Steps:

1. Open `/agent`.
2. Enter agent ID, agent secret, client ID, and scopes.
3. Request agent token.
4. Observe displayed token fields.

Expected observations:

- Token issue succeeds only for allowed scopes and client.
- Token display is masked by default.
- Errors do not reveal secret values.

Reverse-engineered spec:

- Agent token issuance is credential-based and scope-bound.

## S016 Health and Audit Availability

Target requirement: `REQ-PORTAL-010`

Preconditions:

- Portal is deployed against production API.

Steps:

1. Open `/health`.
2. Open `/audit`.
3. Observe network responses.

Expected observations:

- If API endpoints exist, screens show useful status/logs.
- If API endpoints do not exist, screens should not be exposed in navigation or should show an intentional unsupported message.

Reverse-engineered spec:

- Operational screens require matching API endpoints before release.

## Open Questions To Resolve By Execution

| ID | Question | Scenario |
| --- | --- | --- |
| Q001 | Does signup require terms display success, or only consent checkbox? | S004 |
| Q002 | What exact cooldown duration should the UI communicate? | S005, S007, S010 |
| Q003 | Does password reset intentionally return different errors for valid repeated requests? | S007 |
| Q004 | Should login page be reachable directly, or only after `/authorize` starts a session? | S008 |
| Q005 | Should `/me` auto-redirect to `/` when token is missing? | S009 |
| Q006 | Should step-up tokens be displayed raw or copied via one-time control? | S010 |
| Q007 | Should agent tokens ever be displayed raw in the UI? | S015 |

## Defect Ticket Rule

Create a ticket when an observation meets any condition:

- A user-visible flow cannot complete.
- A button allows duplicate requests while a request is pending.
- The backend sends multiple email codes for repeated user clicks within the cooldown window.
- A high-risk operation succeeds without step-up.
- A token, code, or secret is displayed more broadly than required for the flow.
- Portal exposes a screen that depends on an unavailable API endpoint.
