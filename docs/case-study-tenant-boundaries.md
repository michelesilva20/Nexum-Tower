# Case study: tenant and branch access boundaries

## Problem and context

A logistics application must distinguish company ownership from branch-level operational access. A customer belonging to a tenant may be associated with several branches; knowing its identifier must not grant access to another tenant or an unauthorized branch.

## Options

Possible boundaries include application filters, database RLS, and separate databases. These are explanatory alternatives, not a reconstruction of undocumented historical discussions.

## Decision and implementation

The current monorepo has shared PostgreSQL storage with tenant ownership, application authorization and RLS assets. Logistics entities have separate branch associations rather than duplicated tenant-level records.

- `CustomersService` scopes lookups by tenant and calls authorization checks for read/write and branch assignment.
- `AuthorizationService` handles permission and branch scope decisions.
- `runWithTenant` sets `app.current_tenant_id` with transaction-local `set_config`, preventing tenant context from persisting through pooled connections after the transaction.
- SQL assets define RLS enablement, FORCE RLS and isolation checks.

These are separate layers. The helper's presence does not prove every service uses it, and table-owner connections can bypass ordinary RLS. Production validation must include the actual runtime role and executed query paths.

## Validation

The repository includes customer service tests for authorization/scope scenarios, tenant-context tests and an SQL isolation script. The committed CI runs API tests and defines E2E execution after validation on main pushes. This audit read selected paths but did not run the full suite or the isolation SQL against a database. No measured cross-tenant security certification is claimed.

## Tradeoffs and lessons

Application filters make ownership explicit but require consistent usage. RLS adds a boundary only when the runtime role, policies and transaction context are configured correctly. Test denied access and cross-tenant operations as well as successful requests; do not equate the existence of SQL files with deployment enforcement.

## Evidence

- [Customer service](../apps/api/src/modules/customers/customers.service.ts)
- [Customer tests](../apps/api/src/modules/customers/customers.service.spec.ts)
- [Authorization service](../apps/api/src/modules/authorization/authorization.service.ts)
- [Tenant context helper](../packages/database/src/tenant-context.ts)
- [Tenant context tests](../apps/api/src/infrastructure/tenant-context.spec.ts)
- [Isolation SQL](../packages/database/sql/security/05-test-rls-isolation.sql)
- [RLS guide](RLS.md)
