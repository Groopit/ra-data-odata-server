# Changelog

## v2.2.1

- Put odata-client back to 0.6.16 since the new got dependency breaks the browser
## v2.2.0

- Update npm dependencies to fix Dependabot alerts
- Update odata-client dependency to 0.7.0

## v2.1.1

- Update npm dependencies to fix #6 - json-schema vulnerability

## v2.1.0

- Document authentication hook
- Handle all HTTP success status on POSTs (thanks @petecollins73)

## v2.0.0

- Change ra_data_odata_server() factory to take a callback that returns `Promise<RequestInit>` instead
  of `RequestInit`. This allows for supplying a different structure on every call so you can handle things
  like authentication token expiration. This is a breaking change if you were previously passing a `RequestInit`
  structure.
- Cleanup some `any` typescript warnings
- Add changelog.md
