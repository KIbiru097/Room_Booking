import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ManagerRolesPage from "@/app/manager/roles/page"
import { useAuth } from "@/lib/auth-store"
import { managerApi } from "@/lib/services"
import type { User } from "@/lib/types"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/manager/roles",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "x" }),
}))

jest.mock("@/lib/services", () => {
  const actual = jest.requireActual("@/lib/services")
  return {
    ...actual,
    managerApi: {
      ...actual.managerApi,
      hotels: jest.fn(),
      myHotel: jest.fn(),
      roles: jest.fn(),
      permissions: jest.fn(),
      listStaff: jest.fn(),
      staffRoles: jest.fn(),
      assignStaffRole: jest.fn(),
      removeStaffRole: jest.fn(),
      createRole: jest.fn(),
      updateRole: jest.fn(),
      deleteRole: jest.fn(),
      updateRolePermissions: jest.fn(),
    },
  }
})

const mgr = managerApi as unknown as Record<string, jest.Mock>

const managerUser: User = {
  id: "u-mgr",
  email: "miki@luxstay.test",
  fullName: "Miki Alemu",
  role: "MANAGER",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const hotel = { id: "h1", name: "Skylight Hotel" }

const bookingView = {
  id: "p1",
  key: "booking.view",
  module: "booking",
  action: "view",
}
const paymentView = {
  id: "p2",
  key: "payment.view",
  module: "payment",
  action: "view",
}

const supervisorRole = {
  id: "r1",
  name: "Front Desk Supervisor",
  description: "Runs the front desk",
  isActive: true,
  isSystem: false,
  permissions: [{ permission: bookingView }],
  _count: { assignments: 2 },
}

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
  jest.spyOn(window, "confirm").mockReturnValue(true)
  useAuth.setState({
    user: null,
    tokens: null,
    loading: false,
    isInitialized: false,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: false,
  })
  mgr.myHotel.mockResolvedValue(hotel)
  mgr.hotels.mockResolvedValue([hotel])
  mgr.roles.mockResolvedValue([supervisorRole])
  mgr.permissions.mockResolvedValue([bookingView, paymentView])
  mgr.listStaff.mockResolvedValue({ data: [] })
  mgr.staffRoles.mockResolvedValue([])
  mgr.createRole.mockResolvedValue({})
  mgr.updateRole.mockResolvedValue({})
  mgr.updateRolePermissions.mockResolvedValue({})
  mgr.deleteRole.mockResolvedValue({ deleted: true })
  useAuth
    .getState()
    .setSession({ user: managerUser, accessToken: "at", refreshToken: "rt" })
})

afterEach(() => jest.restoreAllMocks())

describe("Manager roles and permissions console", () => {
  it("lists hotel roles with their granted permissions grouped by module", async () => {
    render(<ManagerRolesPage />)

    expect(await screen.findByText("Front Desk Supervisor")).toBeInTheDocument()
    expect(screen.getByText("Runs the front desk")).toBeInTheDocument()
    expect(screen.getByText("booking.view")).toBeInTheDocument()
    expect(screen.getByText("2 staff")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "booking" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "payment" })).toBeInTheDocument()
  })

  it("edits a role name and replaces its permission set", async () => {
    const user = userEvent.setup()
    render(<ManagerRolesPage />)
    await screen.findByText("Front Desk Supervisor")

    await user.click(screen.getByRole("button", { name: "Edit" }))

    const nameInputs = screen.getAllByPlaceholderText("Role name")
    expect(nameInputs).toHaveLength(2)
    await user.clear(nameInputs[1])
    await user.type(nameInputs[1], "Night Auditor")

    const permissionBoxes = screen.getAllByRole("checkbox")
    await user.click(permissionBoxes[permissionBoxes.length - 1])

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(mgr.updateRole).toHaveBeenCalledWith(
        "r1",
        { name: "Night Auditor", description: "Runs the front desk" },
        undefined,
      ),
    )
    await waitFor(() =>
      expect(mgr.updateRolePermissions).toHaveBeenCalledWith(
        "r1",
        ["booking.view", "payment.view"],
        undefined,
      ),
    )
    expect(await screen.findByText("Role updated.")).toBeInTheDocument()
  })

  it("deletes a custom role once it is confirmed", async () => {
    const user = userEvent.setup()
    render(<ManagerRolesPage />)
    await screen.findByText("Front Desk Supervisor")

    await user.click(
      screen.getByRole("button", { name: "Delete Front Desk Supervisor" }),
    )

    await waitFor(() =>
      expect(mgr.deleteRole).toHaveBeenCalledWith("r1", undefined),
    )
    expect(window.confirm).toHaveBeenCalled()
    expect(await screen.findByText("Role deleted.")).toBeInTheDocument()
  })
})
