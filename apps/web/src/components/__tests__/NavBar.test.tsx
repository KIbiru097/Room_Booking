import { render, screen, fireEvent, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import NavBar from "@/components/NavBar"
import { ThemeProvider } from "@/providers/ThemeProvider"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"

let mockPathname = "/"
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(""),
  useParams: () => ({}),
}))

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

const renderNavBar = () =>
  render(
    <ThemeProvider>
      <NavBar />
    </ThemeProvider>,
  )

const getNav = (container: HTMLElement) =>
  container.querySelector("nav") as HTMLElement
const getDrawer = (container: HTMLElement) =>
  container.querySelector("div.md\\:hidden.border-t")

describe("NavBar", () => {
  beforeEach(() => {
    mockPathname = "/"
    mockPush.mockClear()
    mockReplace.mockClear()
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

  it("renders the brand and the labelled primary navigation", () => {
    const { container } = renderNavBar()

    const nav = getNav(container)
    expect(nav).toHaveAttribute("aria-label", "Primary navigation")
    expect(screen.getAllByText("LuxStay").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Luxury Stays").length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: /LuxStay/ })).toHaveAttribute(
      "href",
      "/",
    )
  })

  it("shows sign in and register links when signed out", () => {
    renderNavBar()

    expect(screen.getByRole("link", { name: "Sign In" })).toHaveAttribute(
      "href",
      "/auth?mode=login",
    )
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/auth?mode=register",
    )
    expect(document.querySelector('[aria-haspopup="true"]')).toBeNull()
  })

  it("marks the active desktop link for the current pathname", () => {
    mockPathname = "/search"
    const { container } = renderNavBar()

    const explore = screen.getByRole("link", { name: "Explore Hotels" })
    const home = within(
      container.querySelector("nav") as HTMLElement,
    ).getByRole("link", {
      name: "Home",
    })

    expect(explore.className).toContain("bg-white/15")
    expect(home.className).not.toContain("bg-white/15")
  })

  it("keeps the home link active only on the exact root path", () => {
    mockPathname = "/discover"
    const { container } = renderNavBar()

    const home = within(getNav(container)).getByRole("link", { name: "Home" })
    const discover = within(getNav(container)).getByRole("link", {
      name: "Discover Ethiopia",
    })

    expect(home.className).not.toContain("bg-white/15")
    expect(discover.className).toContain("bg-white/15")
  })

  it("links the admin portal for admins", () => {
    useAuth.setState({ user: buildUser("ADMIN"), tokens: null, isAdmin: true })
    renderNavBar()

    expect(screen.getByRole("link", { name: "Admin Portal" })).toHaveAttribute(
      "href",
      "/admin",
    )
  })

  it("links the manager console for managers", () => {
    useAuth.setState({
      user: buildUser("MANAGER"),
      tokens: null,
      isManager: true,
    })
    renderNavBar()

    expect(
      screen.getByRole("link", { name: "Manager Console" }),
    ).toHaveAttribute("href", "/manager")
  })

  it("links the staff desk for staff", () => {
    useAuth.setState({ user: buildUser("STAFF"), tokens: null, isStaff: true })
    renderNavBar()

    expect(screen.getByRole("link", { name: "Staff Desk" })).toHaveAttribute(
      "href",
      "/staff",
    )
  })

  it("hides the portal link for customers", () => {
    useAuth.setState({
      user: buildUser("CUSTOMER"),
      tokens: null,
      isCustomer: true,
    })
    const { container } = renderNavBar()

    const portalLinks = ["Admin Portal", "Manager Console", "Staff Desk"]
    for (const name of portalLinks) {
      expect(
        within(getNav(container)).queryByRole("link", { name }),
      ).not.toBeInTheDocument()
    }
    expect(
      screen.queryByRole("link", { name: "Dashboard" }),
    ).not.toBeInTheDocument()
  })

  it("opens the signed-in dropdown, shows identity details, then signs out", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      user: buildUser("ADMIN", {
        email: "admin@luxstay.test",
        fullName: "Ada Admin",
      }),
      tokens: null,
      isAdmin: true,
    })
    renderNavBar()

    const trigger = screen.getByRole("button", { name: /Ada Admin/ })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(trigger).toHaveAttribute("aria-haspopup", "true")

    await user.click(trigger)

    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getAllByText("Ada Admin").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText("admin@luxstay.test")).toBeInTheDocument()
    expect(screen.getByText("System Admin")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/admin",
    )

    await user.click(screen.getByRole("button", { name: "Sign Out" }))

    expect(mockPush).toHaveBeenCalledWith("/")
    expect(
      screen.queryByRole("button", { name: /Ada Admin/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument()
  })

  it("closes the user dropdown when clicking outside of it", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      user: buildUser("CUSTOMER"),
      tokens: null,
      isCustomer: true,
    })
    renderNavBar()

    await user.click(screen.getByRole("button", { name: /Guest User/ }))
    expect(screen.getByText("guest@luxstay.test")).toBeInTheDocument()

    fireEvent.mouseDown(document.body)

    expect(screen.queryByText("guest@luxstay.test")).not.toBeInTheDocument()
  })

  it("renders the avatar image when the user has a profile photo", () => {
    useAuth.setState({
      user: buildUser("CUSTOMER", { profilePhotoUrl: "/photos/ada.jpg" }),
      tokens: null,
    })
    renderNavBar()

    const avatar = screen.getByRole("img", { name: "Guest User" })
    expect(decodeURIComponent(avatar.getAttribute("src") ?? "")).toContain(
      "/photos/ada.jpg",
    )
    expect(screen.queryByText("G")).not.toBeInTheDocument()
  })

  it("switches the interface language to Amharic", async () => {
    const user = userEvent.setup()
    renderNavBar()

    const switcher = screen.getByTitle("Switch Language: English / Amharic")
    expect(screen.getByText("EN").className).toContain("text-[#e4bd55]")

    await user.click(switcher)

    expect(localStorage.getItem("luxstay_lang")).toBe("am")
    expect(document.documentElement.lang).toBe("am")
    expect(screen.getByText("አማ").className).toContain("text-[#e4bd55]")
    expect(screen.getByText("EN").className).not.toContain("text-[#e4bd55]")
  })

  it("toggles the colour theme", async () => {
    const user = userEvent.setup()
    renderNavBar()

    const toggle = screen.getByRole("button", { name: "Dark mode" })
    expect(toggle).toBeInTheDocument()

    await user.click(toggle)

    expect(
      screen.getByRole("button", { name: "Light mode" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Dark mode" }),
    ).not.toBeInTheDocument()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("applies the scrolled background once the page is scrolled", () => {
    const { container } = renderNavBar()
    expect(getNav(container).className).toContain("bg-[#0b1528]/85")

    Object.defineProperty(window, "scrollY", {
      value: 120,
      configurable: true,
      writable: true,
    })
    fireEvent.scroll(window)

    expect(getNav(container).className).toContain("bg-[#0b1528]/95")

    Object.defineProperty(window, "scrollY", {
      value: 0,
      configurable: true,
      writable: true,
    })
  })

  it("opens and closes the mobile drawer", async () => {
    const user = userEvent.setup()
    const { container } = renderNavBar()

    const toggle = screen.getByRole("button", {
      name: "Toggle navigation menu",
    })
    expect(getDrawer(container)).toBeNull()

    await user.click(toggle)
    const drawer = getDrawer(container) as HTMLElement
    expect(drawer).not.toBeNull()
    expect(
      within(drawer).getByRole("link", { name: "My Trips" }),
    ).toHaveAttribute("href", "/trips")
    expect(
      within(drawer).getByRole("link", { name: "Transportation" }),
    ).toHaveAttribute("href", "/transportation")
    expect(
      within(drawer).getByRole("link", { name: "Explore Hotels" }),
    ).toHaveAttribute("href", "/search")

    await user.click(toggle)
    expect(getDrawer(container)).toBeNull()
  })

  it("shows sign in and register inside the open mobile drawer when signed out", async () => {
    const user = userEvent.setup()
    const { container } = renderNavBar()

    await user.click(
      screen.getByRole("button", { name: "Toggle navigation menu" }),
    )
    const drawer = getDrawer(container) as HTMLElement

    expect(
      within(drawer).getByRole("link", { name: "Sign In" }),
    ).toHaveAttribute("href", "/auth?mode=login")
    expect(
      within(drawer).getByRole("link", { name: "Register" }),
    ).toHaveAttribute("href", "/auth?mode=register")
    expect(
      within(drawer).getByRole("button", { name: "Dark mode" }),
    ).toBeInTheDocument()
  })

  it("offers sign out and a role-scoped portal inside the mobile drawer when signed in", async () => {
    const user = userEvent.setup()
    useAuth.setState({
      user: buildUser("MANAGER"),
      tokens: null,
      isManager: true,
    })
    const { container } = renderNavBar()

    await user.click(
      screen.getByRole("button", { name: "Toggle navigation menu" }),
    )
    const drawer = getDrawer(container) as HTMLElement

    expect(
      within(drawer).getByRole("link", { name: "Hotel Manager" }),
    ).toHaveAttribute("href", "/manager")
    const signOut = within(drawer).getByRole("button", { name: "Sign Out" })
    expect(signOut).toBeInTheDocument()

    await user.click(signOut)

    expect(mockPush).toHaveBeenCalledWith("/")
    expect(getDrawer(container)).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Sign Out" }),
    ).not.toBeInTheDocument()
  })

  it("closes the mobile drawer after navigating from one of its links", async () => {
    const user = userEvent.setup()
    const { container } = renderNavBar()

    await user.click(
      screen.getByRole("button", { name: "Toggle navigation menu" }),
    )
    const drawer = getDrawer(container) as HTMLElement
    expect(drawer).not.toBeNull()

    await user.click(
      within(drawer).getByRole("link", { name: "Discover Ethiopia" }),
    )

    expect(getDrawer(container)).toBeNull()
  })
})
