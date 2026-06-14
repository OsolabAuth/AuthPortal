import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function readPage(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

describe('Portal production hardening', () => {
  /**
   * Purpose: ensure production pages do not ship development credentials.
   * Input: authentication-related Vue pages.
   * Expected: no demo email, demo password, or development MFA code display remains.
   */
  it('removes development credentials and MFA code exposure', () => {
    const pages = [
      'pages/login.vue',
      'pages/mfa.vue',
      'pages/password/change.vue',
      'pages/password/reset.vue',
      'pages/account/withdrawal.vue'
    ].map(readPage)

    for (const page of pages) {
      assert.equal(page.includes('demo@example.com'), false)
      assert.equal(page.includes('Passw0rd!'), false)
      assert.equal(page.includes('Development code'), false)
      assert.equal(page.includes('developmentCode'), false)
      assert.equal(page.includes('emailCode.value = body.code'), false)
    }
  })

  /**
   * Purpose: prevent empty login submissions before API validation.
   * Input: login page source.
   * Expected: email and password inputs are required.
   */
  it('requires login email and password inputs', () => {
    const page = readPage('pages/login.vue')

    assert.match(page, /type="email" autocomplete="username" required/)
    assert.match(page, /type="password" autocomplete="current-password" required/)
  })

  /**
   * Purpose: make the OIDC login flow complete without a manual token-exchange step.
   * Input: OIDC start and callback page sources.
   * Expected: nonce is persisted, callback automatically exchanges the code, validates nonce, and masks tokens.
   */
  it('automatically completes OIDC callback token exchange', () => {
    const index = readPage('pages/index.vue')
    const callback = readPage('pages/callback.vue')

    assert.match(index, /sessionStorage\.setItem\('nonce', nonce\)/)
    assert.match(callback, /onMounted\(\(\) => \{/)
    assert.match(callback, /void exchangeToken\(\)/)
    assert.match(callback, /sessionStorage\.getItem\('nonce'\)/)
    assert.match(callback, /payload\.nonce !== expectedNonce/)
    assert.match(callback, /Login complete\. Token exchange succeeded\./)
    assert.match(callback, /maskTokenResponse/)
    assert.doesNotMatch(callback, /Exchange token/)
  })

  /**
   * Purpose: prevent empty MFA verification submissions before API validation.
   * Input: MFA page source.
   * Expected: email, email code, and authenticator code inputs are required.
   */
  it('requires MFA email and code inputs', () => {
    const page = readPage('pages/mfa.vue')

    assert.match(page, /type="email" autocomplete="email" required/)
    assert.match(page, /v-model="emailCode" inputmode="numeric" autocomplete="one-time-code" required/)
    assert.match(page, /v-model="authenticatorCode" inputmode="numeric" autocomplete="one-time-code" required/)
  })

  /**
   * Purpose: keep authenticator setup aligned with the hardened AuthFoundation API.
   * Input: MFA page source.
   * Expected: authenticator setup sends a step-up token and prevents setup without one.
   */
  it('sends step-up token for authenticator setup', () => {
    const page = readPage('pages/mfa.vue')

    assert.match(page, /step_up_token: stepUpToken\.value/)
    assert.match(page, /:disabled="!email \|\| !stepUpToken"/)
  })

  /**
   * Purpose: keep account registration behind the email verification flow.
   * Input: signup page source.
   * Expected: the page uses split signup endpoints and does not call the legacy direct signup endpoint.
   */
  it('uses verified signup endpoints instead of legacy direct signup', () => {
    const page = readPage('pages/signup.vue')

    assert.match(page, /\/signup\/email/)
    assert.match(page, /\/signup\/verify/)
    assert.match(page, /\/signup\/account/)
    assert.match(page, /credentials: 'include'/)
    assert.match(page, /Content-Type': 'application\/x-www-form-urlencoded'/)
    assert.match(page, /formBody\(\{ email: email\.value \}\)/)
    assert.match(page, /formBody\(\{\s*code: emailCode\.value\s*\}\)/)
    assert.match(page, /birthdate: birthDate\.value/)
    assert.match(page, /terms_accepted: termsAccepted\.value/)
    assert.doesNotMatch(page, /birth_date: birthDate\.value/)
    assert.doesNotMatch(page, /accepted_terms_id/)
    assert.doesNotMatch(page, /\/signup[`'"]/)
  })

  /**
   * Purpose: prevent empty step-up protected account operation submissions.
   * Input: password change and withdrawal page sources.
   * Expected: password and step-up token inputs are required.
   */
  it('requires password and step-up fields for protected account operations', () => {
    const changePassword = readPage('pages/password/change.vue')
    const withdrawal = readPage('pages/account/withdrawal.vue')

    assert.match(changePassword, /v-model="currentPassword" type="password" autocomplete="current-password" required/)
    assert.match(changePassword, /v-model="newPassword" type="password" autocomplete="new-password" required/)
    assert.match(changePassword, /v-model="stepUpToken" required/)
    assert.match(withdrawal, /v-model="password" type="password" autocomplete="current-password" required/)
    assert.match(withdrawal, /v-model="stepUpToken" required/)
  })

  /**
   * Purpose: prevent incomplete password reset submissions before API validation.
   * Input: password reset page source.
   * Expected: login email, birth date, email code, new password, and confirmation inputs are required.
   */
  it('requires password reset identity fields', () => {
    const page = readPage('pages/password/reset.vue')

    assert.match(page, /\/password\/reset\/start/)
    assert.doesNotMatch(page, /\/mfa\/email\/start/)
    assert.match(page, /birth_date: birthDate\.value/)
    assert.match(page, /:disabled="!email \|\| !birthDate \|\| sendingCode"/)
    assert.match(page, /resetChallengeStarted = ref\(false\)/)
    assert.match(page, /Email code was sent/)
    assert.match(page, /v-model="email" type="email" autocomplete="email" required/)
    assert.match(page, /v-model="birthDate" type="date" required/)
    assert.match(page, /v-model="emailCode" inputmode="numeric" autocomplete="one-time-code" :disabled="!resetChallengeStarted" required/)
    assert.match(page, /email_code: emailCode\.value/)
    assert.match(page, /v-model="newPassword" type="password" autocomplete="new-password" :disabled="!resetChallengeStarted" required/)
    assert.match(page, /v-model="newPasswordConfirm" type="password" autocomplete="new-password" :disabled="!resetChallengeStarted" required/)
  })

  /**
   * Purpose: make delegated AI Agent tokens explainable in the client.
   * Input: Agent page source.
   * Expected: token inspector decodes JWT payloads and surfaces delegated-auth claims without claiming signature verification.
   */
  it('adds an AI Agent token inspector', () => {
    const page = readPage('pages/agent.vue')

    assert.match(page, /Token inspector/)
    assert.match(page, /function inspectJwt/)
    assert.match(page, /function inspectOpaqueToken/)
    assert.match(page, /decodeBase64UrlJson/)
    assert.match(page, /principal_type/)
    assert.match(page, /owner_sub/)
    assert.match(page, /delegation_id/)
    assert.match(page, /Signatures are not verified here/)
    assert.match(page, /This access token is opaque and is validated server-side/)
    assert.match(page, /There is no JWT payload to decode/)
  })
})
