# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report them privately via
[GitHub Security Advisories](https://github.com/CoreyMoen/mast-astro/security/advisories/new).
You should receive a response within a few days.

## Scope notes

- This is a static site: there is no server, no API, and no secrets. The
  build output in `dist/` is plain HTML, CSS, and JavaScript.
- The only client-side storage is the theme preference in `localStorage`.
- Issues in the framework's client scripts (for example, an XSS vector in
  markup a component renders from its props) are in scope.

## Supported versions

Only the latest `main` branch is supported with security updates.
