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
   * Purpose: keep Authenticator setup aligned with the step-up protected API contract.
   * Input: MFA page source.
   * Expected: /mfa/email/start sends only the email and /mfa/authenticator/setup sends step_up_token.
   */
  it('sends step-up token only to authenticator setup', () => {
    const page = readPage('pages/mfa.vue')

    assert.match(page, /\/mfa\/email\/start[\s\S]*body: JSON\.stringify\(\{ email: email\.value \}\)/)
    assert.match(page, /\/mfa\/authenticator\/setup[\s\S]*step_up_token: stepUpToken\.value/)
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
   * Expected: login email, birth date, and new password inputs are required.
   */
  it('requires password reset identity fields', () => {
    const page = readPage('pages/password/reset.vue')

    assert.match(page, /v-model="email" type="email" autocomplete="email" required/)
    assert.match(page, /v-model="birthDate" type="date" required/)
    assert.match(page, /v-model="newPassword" type="password" autocomplete="new-password" required/)
  })
})
