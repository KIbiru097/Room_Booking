/**
 * Front-end capability model for the STAFF operations workspace.
 *
 * Capability keys mirror the API permission catalog (`prisma/seeds/permissions.seed.ts`)
 * so the same vocabulary is used by `PermissionsGuard` on the server.
 *
 * IMPORTANT: this list only controls *visibility of controls*. It is never an
 * authorization boundary — every mutating call still goes through the API where
 * `PermissionsGuard` re-checks the same keys server side.
 *
 * When the workspace cannot resolve a staff member's role assignments (there is
 * currently no self-service endpoint for STAFF to read their own grants), we
 * fall back to the full front-desk operational set so the console stays usable.
 * The server remains the source of truth: a rejected action surfaces through the
 * shared error banner with "You don't have permission to perform this action."
 */

export const STAFF_CAPABILITIES = [
  "booking.view",
  "booking.create",
  "booking.edit",
  "booking.confirm",
  "booking.reject",
  "booking.checkin",
  "booking.checkout",
  "booking.no_show",
  "booking.relocate",
  "room.view",
  "payment.view",
  "payment.mark_cash_paid",
  "guest.view",
  "guest.create",
  "guest.edit",
  "report.view",
  "hotel.view",
  "policy.view",
  "maintenance.view",
  "maintenance.create",
  "maintenance.resolve",
  "housekeeping.view",
  "housekeeping.create_task",
  "housekeeping.assign",
  "housekeeping.complete",
  "workflow.manage",
  "notification.manage",
] as const

export type StaffCapability = typeof STAFF_CAPABILITIES[number]

/** Capabilities deliberately withheld from every STAFF console. */
export const STAFF_RESTRICTED_CAPABILITIES: readonly string[] = [
  "payment.refund",
  "hotel.edit",
  "pricing.edit",
  "role.manage",
  "staff.create",
  "staff.assign_role",
  "settings.edit",
  "coupon.create",
  "coupon.edit",
  "coupon.delete",
]

export type CapabilitySet = ReadonlySet<string>

export const defaultCapabilities: CapabilitySet = new Set<string>(
  STAFF_CAPABILITIES,
)

export function buildCapabilities(resolved?: string[] | null): CapabilitySet {
  if (!resolved || resolved.length === 0) return defaultCapabilities
  const granted = new Set<string>(STAFF_CAPABILITIES)
  for (const key of resolved) {
    if ((STAFF_CAPABILITIES as readonly string[]).includes(key))
      granted.add(key)
  }
  for (const restricted of STAFF_RESTRICTED_CAPABILITIES)
    granted.delete(restricted)
  return granted
}

export function can(caps: CapabilitySet, capability: string): boolean {
  return caps.has(capability)
}

export const PERMISSION_DENIED_MESSAGE =
  "You don't have permission to perform this action."
