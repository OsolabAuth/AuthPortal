import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '..')

async function importTypeScript(path) {
  const source = readFileSync(resolve(root, path), 'utf8')
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      strict: true
    }
  })
  const dataUrl = `data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`
  return import(dataUrl)
}

function encodeBase64UrlJson(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

function makeJwt(payload) {
  return `${encodeBase64UrlJson({ alg: 'none', typ: 'JWT' })}.${encodeBase64UrlJson(payload)}.signature`
}

const { formatClaim, inspectJwt } = await importTypeScript('utils/jwt-inspector.ts')

describe('JWT inspector utility', () => {
  /**
   * Purpose: keep empty token responses from showing false errors.
   * Input: empty token value.
   * Expected: inspection is unavailable and has no error.
   */
  it('returns an unavailable inspection for empty tokens', () => {
    const result = inspectJwt('ID Token', '')

    assert.equal(result.label, 'ID Token')
    assert.equal(result.available, false)
    assert.equal(result.error, '')
    assert.deepEqual(result.claims, {})
    assert.deepEqual(result.importantClaims, [])
  })

  /**
   * Purpose: report token shape errors without throwing from the page.
   * Input: non-JWT token text.
   * Expected: inspection is available with a readable JWT shape error.
   */
  it('reports malformed non-JWT tokens', () => {
    const result = inspectJwt('Access Token', 'not-a-jwt')

    assert.equal(result.available, true)
    assert.equal(result.error, 'Token is not a JWT.')
  })

  /**
   * Purpose: expose delegated-auth claims for review.
   * Input: valid JWT containing AI agent delegated-auth claims.
   * Expected: claims and formatted important claim rows are populated.
   */
  it('decodes a valid JWT payload and formats delegated claims', () => {
    const token = makeJwt({
      principal_type: 'ai_agent',
      sub: 'agent_123',
      agent_id: 'agent_123',
      agent_name: 'Issue Triage Agent',
      owner_sub: 'user_123',
      delegation_id: 'del_123',
      scope: 'task_read task_comment',
      exp: 1760000000,
      amr: ['agent_secret']
    })

    const result = inspectJwt('ID Token', token)

    assert.equal(result.available, true)
    assert.equal(result.error, '')
    assert.equal(result.claims.principal_type, 'ai_agent')
    assert.equal(result.claims.owner_sub, 'user_123')
    assert.match(result.rawPayload, /Issue Triage Agent/)
    assert.deepEqual(
      result.importantClaims.find((claim) => claim.name === 'owner_sub'),
      { name: 'owner_sub', value: 'user_123' }
    )
  })

  /**
   * Purpose: format absent, scalar, and array claim values consistently.
   * Input: undefined, null, empty string, array, and numeric values.
   * Expected: empty values become a dash, arrays are space-joined, scalars become strings.
   */
  it('formats claim values for table display', () => {
    assert.equal(formatClaim(undefined), '-')
    assert.equal(formatClaim(null), '-')
    assert.equal(formatClaim(''), '-')
    assert.equal(formatClaim(['pwd', 'mfa']), 'pwd mfa')
    assert.equal(formatClaim(1760000000), '1760000000')
  })

  /**
   * Purpose: handle invalid payloads without breaking the page.
   * Input: JWT with non-JSON payload.
   * Expected: inspection is available and contains the parse error message.
   */
  it('reports invalid JSON payloads as inspection errors', () => {
    const token = `${encodeBase64UrlJson({ alg: 'none' })}.${Buffer.from('not json').toString('base64url')}.signature`

    const result = inspectJwt('ID Token', token)

    assert.equal(result.available, true)
    assert.match(result.error, /Unexpected token|not valid JSON/)
  })
})
