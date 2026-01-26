# Join Codes Component Plugin

This component stores and validates join codes. It is intentionally generic and does not apply
membership, roles, or CRM tags by itself. Apps are expected to handle side effects after redemption.

## Component responsibilities
- Generate and hash join codes
- Enforce `isActive`, `expiresAt`, and `maxUses`
- Track redemption counts and redemption rows

## App-layer responsibilities
- Platform/org authorization checks
- Membership creation (core-tenant or app-specific)
- Assigning permissions/roles
- Assigning CRM tags or segmentation labels

## Hook points for CRM/Permissions
The `redeemJoinCode` mutation returns:
- `scope` (`platform` or `organization`)
- `organizationId` (for org-scoped codes)
- `label` (batch label such as "alpha-1")
- `joinCodeId`

Apps should use that response to attach side effects:
- **Permissions/Roles:** map `label` or `scope` to a role, then call core-tenant `ensureMembership`.
- **CRM Tags:** map `label` to CRM tags and attach to the user/customer record.

Example flow (app layer):
1. Call `redeemJoinCode` with the plaintext code and user id.
2. If valid, create/activate membership.
3. If CRM is enabled, attach tags using the returned `label` or `scope`.
