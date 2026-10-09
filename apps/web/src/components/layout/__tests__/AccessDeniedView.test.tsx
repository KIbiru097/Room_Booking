import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AccessDeniedView } from "@/components/layout/AccessDeniedView"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"

const originalLogout = useAuth.getState().logout

function makeUser(role: User["role"], overrides: Partial<User> = {}): User {
  return {
    id: `user-${role}`,
    email: `${role.toLowerCase()}@luxstay.test`,
    fullName: `${role} User`,
    role,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("AccessDeniedView", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuth.setState({ user: null, logout: originalLogout })
  })

  afterEach(() => {
    useAuth.setState({ user: null, logout: originalLogout })
  })

  it("shows the access denied copy", () => {
    render(<AccessDeniedView />)

    expect(screen.getByText("403 Access Denied")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Restricted Portal" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "You do not have the authorization required to access this portal.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Switch Account/ }),
    ).toBeInTheDocument()
  })

  it("omits the required privilege line when no roles are supplied", () => {
    render(<AccessDeniedView />)

    expect(screen.queryByText(/Required privilege:/)).not.toBeInTheDocument()
  })

  it("lists the required roles joined by the translated separator", () => {
    render(<AccessDeniedView requiredRoles={["ADMIN", "MANAGER"]} />)

    expect(screen.getByText("Required privilege:")).toBeInTheDocument()
    expect(screen.getByText("ADMIN or MANAGER")).toBeInTheDocument()
  })

  it("does not offer a portal link for signed out visitors", () => {
    render(<AccessDeniedView />)

    expect(screen.queryByText(/Signed in as:/)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Return Home/ })).toHaveAttribute(
      "href",
      "/",
    )
  })

  it.each([
    ["ADMIN", "/admin", "Go to Admin Portal"],
    ["MANAGER", "/manager", "Go to Manager Console"],
    ["STAFF", "/staff", "Go to Staff Desk"],
    ["CUSTOMER", "/dashboard", "Go to My Trips"],
  ] as const)("routes %s users to %s", (role, href, label) => {
    useAuth.setState({ user: makeUser(role) })

    render(<AccessDeniedView requiredRoles={["ADMIN"]} />)

    const portalLink = screen.getByRole("link", { name: label })
    expect(portalLink).toHaveAttribute("href", href)
  })

  it("names the signed-in account", () => {
    useAuth.setState({
      user: makeUser("MANAGER", { email: "manager@luxstay.test" }),
    })

    render(<AccessDeniedView requiredRoles={["MANAGER"]} />)

    expect(screen.getByText(/Signed in as:/)).toBeInTheDocument()
    expect(screen.getByText("manager@luxstay.test")).toBeInTheDocument()
    expect(screen.getByText(/\(MANAGER\)/)).toBeInTheDocument()
  })

  it("logs the user out when switching accounts", async () => {
    const user = userEvent.setup()
    const logout = jest.fn()
    useAuth.setState({ user: makeUser("CUSTOMER"), logout })

    render(<AccessDeniedView />)

    await user.click(screen.getByRole("button", { name: /Switch Account/ }))

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it("keeps the home link visible for signed-in users", () => {
    useAuth.setState({ user: makeUser("STAFF") })

    render(<AccessDeniedView requiredRoles={["STAFF"]} />)

    expect(screen.getByRole("link", { name: /Return Home/ })).toHaveAttribute(
      "href",
      "/",
    )
    expect(
      screen.getByRole("link", { name: "Go to Staff Desk" }),
    ).toHaveAttribute("href", "/staff")
  })
})
