import { render, screen } from "@testing-library/react"
import AuthGate from "@/components/AuthGate"
import { useAuth } from "@/lib/auth-store"
import type { User } from "@/lib/types"

let mockPathname = "/dashboard"
const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
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

describe("AuthGate", () => {
  beforeEach(() => {
    localStorage.clear()
    mockPathname = "/dashboard"
    mockReplace.mockClear()
    mockPush.mockClear()
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

  it("shows the rehydration skeleton while auth is not initialized", () => {
    const { container } = render(
      <AuthGate>
        <p>secret content</p>
      </AuthGate>,
    )

    expect(screen.queryByText("secret content")).not.toBeInTheDocument()
    const skeletons = container.querySelectorAll(
      '[aria-hidden="true"].animate-pulse',
    )
    expect(skeletons.length).toBeGreaterThanOrEqual(5)
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("redirects anonymous visitors to the auth screen with a return path", () => {
    useAuth.setState({ isInitialized: true })
    mockPathname = "/trips/42"

    const { container } = render(
      <AuthGate>
        <p>secret content</p>
      </AuthGate>,
    )

    expect(container).toBeEmptyDOMElement()
    expect(mockReplace).toHaveBeenCalledWith(
      `/auth?returnTo=${encodeURIComponent("/trips/42")}`,
    )
  })

  it("does not redirect before initialization completes", () => {
    useAuth.setState({ isInitialized: false, user: null })

    render(
      <AuthGate>
        <p>secret content</p>
      </AuthGate>,
    )

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("renders children when the user holds an allowed role", () => {
    useAuth.setState({
      isInitialized: true,
      user: buildUser("MANAGER"),
      isManager: true,
    })

    render(
      <AuthGate roles={["MANAGER", "ADMIN"]}>
        <p>manager dashboard</p>
      </AuthGate>,
    )

    expect(screen.getByText("manager dashboard")).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("renders children when no roles are required", () => {
    useAuth.setState({
      isInitialized: true,
      user: buildUser("CUSTOMER"),
      isCustomer: true,
    })

    render(
      <AuthGate>
        <p>customer area</p>
      </AuthGate>,
    )

    expect(screen.getByText("customer area")).toBeInTheDocument()
  })

  it("treats an empty roles array as unrestricted", () => {
    useAuth.setState({
      isInitialized: true,
      user: buildUser("CUSTOMER"),
      isCustomer: true,
    })

    render(
      <AuthGate roles={[]}>
        <p>customer area</p>
      </AuthGate>,
    )

    expect(screen.getByText("customer area")).toBeInTheDocument()
  })

  it("shows the authoritative 403 view when the role is missing", () => {
    useAuth.setState({
      isInitialized: true,
      user: buildUser("CUSTOMER"),
      isCustomer: true,
    })

    render(
      <AuthGate roles={["ADMIN", "MANAGER"]}>
        <p>admin console</p>
      </AuthGate>,
    )

    expect(screen.queryByText("admin console")).not.toBeInTheDocument()
    expect(screen.getByText("403 Access Denied")).toBeInTheDocument()
    expect(screen.getByText("Restricted Portal")).toBeInTheDocument()
    expect(screen.getByText(/Required privilege:/)).toHaveTextContent(
      "ADMIN or MANAGER",
    )
    expect(screen.getByText(/Signed in as:/)).toHaveTextContent(
      "guest@luxstay.test",
    )
    expect(
      screen.getByRole("button", { name: "Return Home" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Switch Account" }),
    ).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("links the matching portal in the denied view", () => {
    useAuth.setState({
      isInitialized: true,
      user: buildUser("CUSTOMER"),
      isCustomer: true,
    })

    render(
      <AuthGate roles={["ADMIN"]}>
        <p>admin console</p>
      </AuthGate>,
    )

    const portalButton = screen.getByRole("button", { name: "Go to My Trips" })
    expect(portalButton.closest("a")).toHaveAttribute("href", "/dashboard")
  })

  it("returns nothing for signed-out users once initialized", () => {
    useAuth.setState({ isInitialized: true, user: null })

    const { container } = render(
      <AuthGate>
        <p>secret content</p>
      </AuthGate>,
    )

    expect(container).toBeEmptyDOMElement()
    expect(mockReplace).toHaveBeenCalledWith(
      `/auth?returnTo=${encodeURIComponent("/dashboard")}`,
    )
  })
})
