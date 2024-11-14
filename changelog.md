# Changelog

## v5.0.0

- Major version number update due to supporting (and requiring) react-admin 5.* thanks to @RemcoEF4.
- Add support for vite and an example project thanks to @RemcoEF4
- Add _q_int filter operator to search for numbers containing digits thanks to @RemcoEF4
- Fix inc_any filter when used in combination with another filter thanks to @RemcoEF4
- Filtering on getList() defaults to 'q' if an operator was not explicitly specified
- Update npm dependencies

## v4.3.0

- Add support for all react-admin filter operators thanks to @yarkovaleksei
- Support for expand, select, and sort transformations, thanks to @yarkovaleksei

## v4.2.0

- Fix promise handling in deleteMany, thanks again to @gebsl!
- Update npm dependencies

## v4.1.0

- Add list filter support, thanks again to @gebsl!
- Update @odata/client to v2.21.6
- Update npm dependencies

## v4.0.0

- **BREAKING CHANGE** If you were returning the `headers` property in the options callback,
  this property name has changed to `commonHeaders` for compatibility with the underlying @odata/client
  library
- Add support for returning a `fetchProxy` to allow users complete control over the fetch operation. Fixes
  #11 and #13. Thanks to @gebsl for the contribution!
- Add support for `Edm.Int16` and `Edm.Int64` identifiers. Fixes #12, thanks again to @gebsl!

## v3.0.2

- fix bug where update() wasn't returning the new record

## v3.0.1

- Move ra-core from devDependencies to Dependencies

## v3.0.0

- Major version as there are breaking changes
- Add support for react-admin 4.x, drop 3.x
- Switch from odata-client to @odata/client package
- Add OData action support
- Add an example react-admin 4.x site
- Use a proxy for example sites to avoid CORS issues
- Fix some ID remapping issues

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
