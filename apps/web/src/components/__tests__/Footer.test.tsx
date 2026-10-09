import { render, screen, within } from "@testing-library/react"
import Footer from "@/components/Footer"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"

const buildUser = (
  role: User["role"],
  overrides: Partial<User> = {},
): User => ({
  id: "u-1",
  email: "guest@luxstay.test",
  fullName: "Guest User",
  role,
  isActive: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  ...overrides,
})

describe("Footer", () => {
  beforeEach(() => {
    localStorage.clear()
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
  })

  it("renders the brand block and tagline", () => {
    render(<Footer />)

    expect(screen.getAllByText("LuxStay").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Luxury Stays").length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(
        "Curated boutique suites and five-star resorts across Ethiopia.",
      ),
    ).toBeInTheDocument()
  })

  it("renders the explore column links", () => {
    render(<Footer />)

    const explore = screen.getByRole("navigation", { name: "Explore" })
    expect(within(explore).getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    )
    expect(
      within(explore).getByRole("link", { name: "Discover Ethiopia" }),
    ).toHaveAttribute("href", "/discover")
    expect(
      within(explore).getByRole("link", { name: "Explore Hotels" }),
    ).toHaveAttribute("href", "/search")
    expect(
      within(explore).getByRole("link", { name: "Emergency Services" }),
    ).toHaveAttribute("href", "/emergency")
  })

  it("shows signed-out account links and the portal hint for anonymous visitors", () => {
    render(<Footer />)

    const account = screen.getByRole("navigation", { name: "Account" })
    expect(
      within(account).getByRole("link", { name: "Sign In" }),
    ).toHaveAttribute("href", "/auth?mode=login")
    expect(
      within(account).getByRole("link", { name: "Register" }),
    ).toHaveAttribute("href", "/auth?mode=register")

    const portals = screen.getByRole("navigation", { name: "Portals" })
    expect(
      within(portals).getByText(
        "Sign in with a staff, manager or admin account to open the back-office portals.",
      ),
    ).toBeInTheDocument()
    expect(within(portals).queryByRole("link")).not.toBeInTheDocument()
  })

  it("shows signed-in account links for a customer", () => {
    useAuth.setState({ user: buildUser("CUSTOMER") })
    render(<Footer />)

    const account = screen.getByRole("navigation", { name: "Account" })
    expect(
      within(account).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/dashboard")
    expect(
      within(account).getByRole("link", { name: "My Trips" }),
    ).toHaveAttribute("href", "/trips")
    expect(
      within(account).getByRole("link", { name: "Favorites" }),
    ).toHaveAttribute("href", "/favorites")
    expect(
      within(account).getByRole("link", { name: "Payment History" }),
    ).toHaveAttribute("href", "/payment-history")
  })

  it("keeps the portal hint for customers, who have no back-office portal", () => {
    useAuth.setState({ user: buildUser("CUSTOMER") })
    render(<Footer />)

    const portals = screen.getByRole("navigation", { name: "Portals" })
    expect(within(portals).queryByRole("link")).not.toBeInTheDocument()
    expect(
      within(portals).getByText(
        /Sign in with a staff, manager or admin account/,
      ),
    ).toBeInTheDocument()
  })

  it("links the admin portal for ADMIN users", () => {
    useAuth.setState({ user: buildUser("ADMIN"), isAdmin: true })
    render(<Footer />)

    const portals = screen.getByRole("navigation", { name: "Portals" })
    expect(
      within(portals).getByRole("link", { name: "Admin Portal" }),
    ).toHaveAttribute("href", "/admin")
    expect(
      within(portals).queryByText(/Sign in with a staff/),
    ).not.toBeInTheDocument()
  })

  it("links the manager console for MANAGER users", () => {
    useAuth.setState({ user: buildUser("MANAGER"), isManager: true })
    render(<Footer />)

    const portals = screen.getByRole("navigation", { name: "Portals" })
    expect(
      within(portals).getByRole("link", { name: "Manager Console" }),
    ).toHaveAttribute("href", "/manager")
  })

  it("links the staff desk for STAFF users", () => {
    useAuth.setState({ user: buildUser("STAFF"), isStaff: true })
    render(<Footer />)

    const portals = screen.getByRole("navigation", { name: "Portals" })
    expect(
      within(portals).getByRole("link", { name: "Staff Desk" }),
    ).toHaveAttribute("href", "/staff")
  })

  it("shows the copyright line with the current year", () => {
    render(<Footer />)

    expect(
      screen.getByText(
        `© ${new Date().getFullYear()} LuxStay. All rights reserved.`,
      ),
    ).toBeInTheDocument()
  })
})
