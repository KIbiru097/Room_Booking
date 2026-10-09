import { act, render, screen, waitFor } from "@testing-library/react"
import RootLayout from "@/app/layout"
import { useAuth } from "@/lib/auth-store"
import { toast, useToastStore } from "@/components/ui/Toast"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useParams: () => ({ id: "1" }),
  useSearchParams: () => new URLSearchParams(""),
}))

const anonymousState = {
  user: null,
  tokens: null,
  loading: false,
  isInitialized: false,
  isAdmin: false,
  isManager: false,
  isStaff: false,
  isCustomer: false,
}

describe("RootLayout", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    document.documentElement.style.colorScheme = ""
    useAuth.setState({ ...anonymousState })
    useToastStore.setState({ toasts: [] })
  })

  it("renders the passed children inside the main landmark", () => {
    render(
      <RootLayout>
        <p>page-body-marker</p>
      </RootLayout>,
    )

    const main = screen.getByRole("main")
    expect(main).toBeInTheDocument()
    expect(main).toHaveTextContent("page-body-marker")
  })

  it("mounts the site chrome around the children", () => {
    render(
      <RootLayout>
        <p>page-body-marker</p>
      </RootLayout>,
    )

    expect(screen.getByRole("contentinfo")).toBeInTheDocument()
    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0)
    expect(screen.getByRole("main").querySelector("p")).toHaveTextContent(
      "page-body-marker",
    )
  })

  it("mounts AppProviders: the theme provider persists a theme choice", () => {
    render(
      <RootLayout>
        <p>page-body-marker</p>
      </RootLayout>,
    )

    expect(localStorage.getItem("luxstay-theme")).toBe("light")
    expect(document.documentElement.style.colorScheme).toBe("light")
  })

  it("mounts AppProviders: the auth store is hydrated on mount", async () => {
    expect(useAuth.getState().isInitialized).toBe(false)

    render(
      <RootLayout>
        <p>page-body-marker</p>
      </RootLayout>,
    )

    await waitFor(() => expect(useAuth.getState().isInitialized).toBe(true))
    expect(useAuth.getState().user).toBeNull()
  })

  it("mounts AppProviders: the toast container reacts to store updates", async () => {
    render(
      <RootLayout>
        <p>page-body-marker</p>
      </RootLayout>,
    )

    expect(screen.queryByText("Route saved")).not.toBeInTheDocument()

    act(() => {
      toast.success("Route saved", "Your itinerary is up to date.")
    })

    expect(await screen.findByRole("status")).toHaveTextContent("Route saved")
    expect(
      screen.getByText("Your itinerary is up to date."),
    ).toBeInTheDocument()
  })
})
