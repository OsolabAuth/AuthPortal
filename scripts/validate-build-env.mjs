const required = [
  'NUXT_PUBLIC_AUTH_API_BASE',
  'NUXT_PUBLIC_AUTH_CLIENT_ID',
  'NUXT_PUBLIC_AUTH_SCOPE'
]

const placeholderValues = new Map([
  ['NUXT_PUBLIC_AUTH_CLIENT_ID', new Set(['00000000000000000000000000000000'])]
])

const errors = []

for (const name of required) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    errors.push(`${name} is required.`)
    continue
  }

  const placeholders = placeholderValues.get(name)
  if (placeholders?.has(value.trim())) {
    errors.push(`${name} must not use a placeholder value.`)
  }
}

for (const name of ['NUXT_PUBLIC_AUTH_API_BASE']) {
  const value = process.env[name]
  if (!value) {
    continue
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      errors.push(`${name} must be an http or https URL.`)
    }
  }
  catch {
    errors.push(`${name} must be a valid absolute URL.`)
  }
}

if (errors.length > 0) {
  console.error('Build environment validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Build environment validation passed.')
