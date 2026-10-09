"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"
import AuthGate from "@/components/AuthGate"
import { managerApi } from "@/lib/services"
import { useAuth } from "@/lib/auth-store"
import type { Hotel, HotelStaffMember } from "@/lib/types"

type Permission = { id: string ;key: string ;module: string ;action: string }
type HotelRole = {
  id: string
  name: string
  description?: string | null
  isActive?: boolean
  isSystem?: boolean
  permissions: Array<{ permission: Permission }>
  _count?: { assignments: number }
}
type StaffRoleAssignment = {
  id: string
  roleId: string
  role: { id: string ;name: string }
}

export default function ManagerRolesPage() {
  return (
    <AuthGate roles={["MANAGER", "ADMIN"]}>
      <RolesConsole />
    </AuthGate>
  )
}

function RolesConsole() {
  const isAdmin = useAuth((state) => state.user?.role === "ADMIN")
  const [roles, setRoles] = useState<HotelRole[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [staff, setStaff] = useState<HotelStaffMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [assignments, setAssignments] = useState<StaffRoleAssignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState("")
  const [editingRoleId, setEditingRoleId] = useState("")
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const hotelList = isAdmin
        ? await managerApi.hotels()
        : [await managerApi.myHotel()]
      const hotel =
        hotelList.find((item) => item.id === selectedHotelId) ?? hotelList[0]
      if (!hotel) {
        setHotels(hotelList)
        setRoles([])
        setStaff([])
        setError("No hotels are available for role management.")
        return
      }
      const [roleData, permissionData, staffData] = await Promise.all([
        managerApi.roles(isAdmin ? hotel.id : undefined),
        managerApi.permissions(),
        managerApi.listStaff(hotel.id),
      ])
      setHotels(hotelList)
      setSelectedHotelId(hotel.id)
      setRoles(roleData as HotelRole[])
      setPermissions(permissionData as Permission[])
      setStaff(staffData.data)
      setSelectedStaffId(
        (current) =>
          current ||
          staffData.data[0]?.staffId ||
          staffData.data[0]?.user?.id ||
          "",
      )
      setSelectedRoleId(
        (current) => current || (roleData as HotelRole[])[0]?.id || "",
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load roles and permissions.",
      )
    } finally {
      setLoading(false)
    }
  }, [isAdmin, selectedHotelId])

  useEffect(() => {
    void load()
  }, [load])

  const loadAssignments = useCallback(async () => {
    if (!selectedStaffId) {
      setAssignments([])
      return
    }
    setAssignmentsLoading(true)
    try {
      setAssignments(
        (await managerApi.staffRoles(
          selectedStaffId,
          isAdmin ? selectedHotelId : undefined,
        )) as StaffRoleAssignment[],
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staff role assignments.",
      )
    } finally {
      setAssignmentsLoading(false)
    }
  }, [isAdmin, selectedHotelId, selectedStaffId])

  useEffect(() => {
    void loadAssignments()
  }, [loadAssignments])

  const grouped = useMemo(
    () =>
      permissions.reduce<Record<string, Permission[]>>((result, permission) => {
        ;(result[permission.module] ||= []).push(permission)
        return result
      }, {}),
    [permissions],
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError("")
    setMessage("")
    try {
      await managerApi.createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        permissionKeys: selected,
        ...(isAdmin ? { hotelId: selectedHotelId } : {}),
      })
      setName("")
      setDescription("")
      setSelected([])
      setMessage("Role created successfully.")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create role.")
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: string) =>
    setSelected((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    )

  const scopeHotelId = isAdmin ? selectedHotelId : undefined

  const startEdit = (role: HotelRole) => {
    setEditingRoleId(role.id)
    setEditName(role.name)
    setEditDescription(role.description ?? "")
    setEditPermissions(role.permissions.map((entry) => entry.permission.key))
  }

  const cancelEdit = () => {
    setEditingRoleId("")
    setEditPermissions([])
  }

  const toggleEditPermission = (key: string) =>
    setEditPermissions((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    )

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingRoleId || !editName.trim()) return
    setSavingEdit(true)
    setError("")
    setMessage("")
    try {
      await managerApi.updateRole(
        editingRoleId,
        { name: editName.trim(), description: editDescription.trim() || null },
        scopeHotelId,
      )
      await managerApi.updateRolePermissions(
        editingRoleId,
        editPermissions,
        scopeHotelId,
      )
      setMessage("Role updated.")
      cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update role.")
    } finally {
      setSavingEdit(false)
    }
  }

  const removeRole = async (role: HotelRole) => {
    if (
      !window.confirm(
        `Delete “${role.name}”? Staff members must be unassigned first.`,
      )
    )
      return
    setDeletingRoleId(role.id)
    setError("")
    setMessage("")
    try {
      await managerApi.deleteRole(role.id, scopeHotelId)
      setMessage("Role deleted.")
      if (editingRoleId === role.id) cancelEdit()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete role.")
    } finally {
      setDeletingRoleId("")
    }
  }

  const assignRole = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedStaffId || !selectedRoleId) return
    setAssigning(true)
    setError("")
    setMessage("")
    try {
      await managerApi.assignStaffRole(selectedStaffId, {
        roleId: selectedRoleId,
      })
      setMessage("Role assigned to staff member.")
      await loadAssignments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to assign role.")
    } finally {
      setAssigning(false)
    }
  }

  const removeAssignment = async (assignment: StaffRoleAssignment) => {
    if (!selectedStaffId) return
    setError("")
    setMessage("")
    try {
      await managerApi.removeStaffRole(
        selectedStaffId,
        assignment.roleId,
        isAdmin ? selectedHotelId : undefined,
      )
      setMessage("Role removed from staff member.")
      await loadAssignments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove role.")
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Manager settings
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Roles & permissions
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Create hotel-scoped roles and grant only the operations each staff
              member needs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Hotel
                <select
                  value={selectedHotelId}
                  onChange={(event) => {
                    setSelectedHotelId(event.target.value)
                    setSelectedStaffId("")
                    setAssignments([])
                  }}
                  className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="">Select hotel</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm"
            >
              Refresh
            </button>
          </div>
        </header>
        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Plus className="h-5 w-5 text-amber-600" />
              Create role
            </h2>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Role name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description (optional)"
                className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
              />
              <div className="max-h-[28rem] space-y-4 overflow-y-auto rounded-xl border border-slate-100 p-3">
                {Object.entries(grouped).map(([module, items]) => (
                  <fieldset key={module}>
                    <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {module}
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((permission) => (
                        <label
                          key={permission.key}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(permission.key)}
                            onChange={() => toggle(permission.key)}
                            className="h-4 w-4 accent-amber-600"
                          />
                          {permission.action.replaceAll("_", " ")}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              <button
                disabled={saving || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Create role
              </button>
            </form>
          </section>
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                Hotel roles
              </h2>
              {loading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading roles…
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {roles.map((role) => {
                    const editing = editingRoleId === role.id
                    return (
                      <article
                        key={role.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {role.name}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {role.description || "No description"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                              {role._count?.assignments ?? 0} staff
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                editing ? cancelEdit() : startEdit(role)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-amber-300 hover:text-amber-700"
                            >
                              {editing ? (
                                <X className="h-3 w-3" />
                              ) : (
                                <Pencil className="h-3 w-3" />
                              )}
                              {editing ? "Cancel" : "Edit"}
                            </button>
                            {!role.isSystem && (
                              <button
                                type="button"
                                onClick={() => void removeRole(role)}
                                disabled={deletingRoleId === role.id}
                                aria-label={`Delete ${role.name}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingRoleId === role.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        {editing ? (
                          <form
                            onSubmit={saveEdit}
                            className="mt-4 space-y-3 border-t border-slate-100 pt-4"
                          >
                            <input
                              required
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                              placeholder="Role name"
                              disabled={role.isSystem}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 disabled:bg-slate-50 disabled:text-slate-500"
                            />
                            <textarea
                              value={editDescription}
                              onChange={(event) =>
                                setEditDescription(event.target.value)
                              }
                              placeholder="Description (optional)"
                              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                            />
                            <div className="max-h-64 space-y-4 overflow-y-auto rounded-xl border border-slate-100 p-3">
                              {Object.entries(grouped).map(
                                ([moduleName, items]) => (
                                  <fieldset key={moduleName}>
                                    <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                      {moduleName}
                                    </legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {items.map((permission) => (
                                        <label
                                          key={permission.key}
                                          className="flex cursor-pointer items-center gap-2 text-sm"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={editPermissions.includes(
                                              permission.key,
                                            )}
                                            onChange={() =>
                                              toggleEditPermission(
                                                permission.key,
                                              )
                                            }
                                            className="h-4 w-4 accent-amber-600"
                                          />
                                          {permission.action.replaceAll(
                                            "_",
                                            " ",
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  </fieldset>
                                ),
                              )}
                            </div>
                            <button
                              disabled={savingEdit}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                            >
                              {savingEdit ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Save changes
                            </button>
                          </form>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {role.permissions.map(({ permission }) => (
                              <span
                                key={permission.key}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"
                              >
                                <Check className="h-3 w-3" />
                                {permission.key}
                              </span>
                            ))}
                            {role.permissions.length === 0 && (
                              <span className="text-xs text-slate-400">
                                No permissions assigned
                              </span>
                            )}
                          </div>
                        )}
                      </article>
                    )
                  })}
                  {roles.length === 0 && (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No hotel roles created yet.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <UserPlus className="h-5 w-5 text-amber-600" />
                Assign staff roles
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Assignments are limited to staff members assigned to your hotel.
              </p>
              {loading ? (
                <div className="py-6 text-sm text-slate-500">
                  Loading staff…
                </div>
              ) : staff.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  No staff members are assigned to your hotel yet.
                </p>
              ) : (
                <>
                  <form
                    onSubmit={assignRole}
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <select
                      value={selectedStaffId}
                      onChange={(event) =>
                        setSelectedStaffId(event.target.value)
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                      {staff.map((member) => {
                        const user = member.staff || member.user
                        const id = member.staffId || user?.id || member.id
                        return (
                          <option key={id} value={id}>
                            {user?.fullName || user?.email || id}
                          </option>
                        )
                      })}
                    </select>
                    <select
                      value={selectedRoleId}
                      onChange={(event) =>
                        setSelectedRoleId(event.target.value)
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                    >
                      <option value="">Select role</option>
                      {roles
                        .filter((role) => role.isActive !== false)
                        .map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                    </select>
                    <button
                      disabled={assigning || !selectedRoleId}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {assigning ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Assign
                    </button>
                  </form>
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Current assignments
                    </h3>
                    {assignmentsLoading ? (
                      <p className="mt-3 text-sm text-slate-500">
                        Loading assignments…
                      </p>
                    ) : assignments.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        No custom roles assigned.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                          >
                            <span className="text-sm font-semibold text-slate-700">
                              {assignment.role.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => void removeAssignment(assignment)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                              aria-label={`Remove ${assignment.role.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
