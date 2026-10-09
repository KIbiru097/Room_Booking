import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AuthPage from "@/app/auth/page"
import {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useGoogleLoginMutation,
  useVerifyMfaMutation,
} from "@/hooks/use-auth"
import { useAuth } from "@/lib/auth-store"

let mockSearchString = ""
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/auth",
  useSearchParams: () => new URLSearchParams(mockSearchString),
  useParams: () => ({}),
}))

jest.mock("@/hooks/use-auth", () => ({
  useLoginMutation: jest.fn(),
  useRegisterMutation: jest.fn(),
  useForgotPasswordMutation: jest.fn(),
  useGoogleLoginMutation: jest.fn(),
  useVerifyMfaMutation: jest.fn(),
}))

const mockLogin = useLoginMutation as jest.Mock
const mockRegister = useRegisterMutation as jest.Mock
const mockForgot = useForgotPasswordMutation as jest.Mock
const mockGoogle = useGoogleLoginMutation as jest.Mock
const mockMfa = useVerifyMfaMutation as jest.Mock

function mutation(resolveWith?: unknown, rejectWith?: Error) {
  const mutateAsync = jest
    .fn()
    .mockImplementation(() =>
      rejectWith ? Promise.reject(rejectWith) : Promise.resolve(resolveWith),
    )
  return { mutateAsync, isPending: false, mutate: jest.fn(), reset: jest.fn() }
}

const CUSTOMER = {
  id: "u1",
  email: "guest@example.com",
  fullName: "Guest One",
  role: "CUSTOMER" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  mockSearchString = ""
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
  mockLogin.mockReturnValue(mutation())
  mockRegister.mockReturnValue(mutation())
  mockForgot.mockReturnValue(mutation())
  mockGoogle.mockReturnValue(mutation())
  mockMfa.mockReturnValue(mutation())
})

describe("auth page", () => {
  it("renders the login form by default", () => {
    render(<AuthPage />)

    expect(
      screen.getByRole("heading", { name: "Welcome Back" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Sign in to access your luxury itineraries and bookings",
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled()
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument()
  })

  it("surfaces zod validation errors and does not call the login mutation", async () => {
    const user = userEvent.setup()
    const login = mutation()
    mockLogin.mockReturnValue(login)

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Email Address"), "foo@bar")
    await user.type(screen.getByLabelText("Password"), "short")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    expect(
      await screen.findByText("Invalid email address format"),
    ).toBeInTheDocument()
    expect(
      await screen.findByText("String must contain at least 8 character(s)"),
    ).toBeInTheDocument()
    expect(login.mutateAsync).not.toHaveBeenCalled()
  })

  it("requires an email before submitting login", async () => {
    const user = userEvent.setup()
    const login = mutation()
    mockLogin.mockReturnValue(login)

    render(<AuthPage />)
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    expect(
      await screen.findByText("Email address is required"),
    ).toBeInTheDocument()
    expect(login.mutateAsync).not.toHaveBeenCalled()
  })

  it("submits valid credentials to the login mutation", async () => {
    const user = userEvent.setup()
    const login = mutation()
    mockLogin.mockReturnValue(login)

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Email Address"), "guest@example.com")
    await user.type(screen.getByLabelText("Password"), "secret123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() =>
      expect(login.mutateAsync).toHaveBeenCalledWith({
        email: "guest@example.com",
        password: "secret123",
      }),
    )
  })

  it("shows an alert when the login mutation rejects", async () => {
    const user = userEvent.setup()
    mockLogin.mockReturnValue(
      mutation(undefined, new Error("Invalid credentials")),
    )

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Email Address"), "guest@example.com")
    await user.type(screen.getByLabelText("Password"), "secret123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials",
    )
  })

  it("toggles password visibility", async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    const password = screen.getByLabelText("Password")
    expect(password).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")
  })

  it("reports Google sign-in as unavailable when the GIS script is missing", async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Google sign-in is unavailable. Please sign in with your email and password.",
    )
  })

  it("walks through the MFA challenge after an admin login", async () => {
    const user = userEvent.setup()
    const login = mutation({
      mfaRequired: true,
      challengeToken: "challenge-token-1234567890",
    })
    const mfa = mutation()
    mockLogin.mockReturnValue(login)
    mockMfa.mockReturnValue(mfa)

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Email Address"), "admin@example.com")
    await user.type(screen.getByLabelText("Password"), "secret123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    expect(
      await screen.findByLabelText("Authenticator code"),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeDisabled()

    await user.type(screen.getByLabelText("Authenticator code"), "123456")
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeEnabled()

    await user.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    )
    await waitFor(() =>
      expect(mfa.mutateAsync).toHaveBeenCalledWith({
        challengeToken: "challenge-token-1234567890",
        code: "123456",
      }),
    )
  })

  it("returns to the sign-in form from the MFA challenge", async () => {
    const user = userEvent.setup()
    mockLogin.mockReturnValue(
      mutation({
        mfaRequired: true,
        challengeToken: "challenge-token-1234567890",
      }),
    )

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Email Address"), "admin@example.com")
    await user.type(screen.getByLabelText("Password"), "secret123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await user.click(
      await screen.findByRole("button", { name: "Back to sign in" }),
    )

    expect(screen.getByLabelText("Email Address")).toBeInTheDocument()
    expect(
      screen.queryByLabelText("Authenticator code"),
    ).not.toBeInTheDocument()
  })

  it("shows an alert when the MFA code is rejected", async () => {
    const user = userEvent.setup()
    mockLogin.mockReturnValue(
      mutation({
        mfaRequired: true,
        challengeToken: "challenge-token-1234567890",
      }),
    )
    mockMfa.mockReturnValue(
      mutation(undefined, new Error("Invalid authenticator code")),
    )

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Email Address"), "admin@example.com")
    await user.type(screen.getByLabelText("Password"), "secret123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))
    await user.type(
      await screen.findByLabelText("Authenticator code"),
      "000000",
    )
    await user.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid authenticator code",
    )
  })

  it("switches to registration from the mode switcher", async () => {
    const user = userEvent.setup()
    render(<AuthPage />)

    await user.click(screen.getByRole("button", { name: "Create Account" }))

    expect(
      screen.getByRole("heading", { name: "Join LuxStay" }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Full Name *")).toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith("/auth?mode=register")
  })

  it("validates the registration form before calling the mutation", async () => {
    const user = userEvent.setup()
    const register = mutation()
    mockRegister.mockReturnValue(register)
    mockSearchString = "mode=register"

    render(<AuthPage />)
    await user.click(screen.getByRole("button", { name: "Create Account" }))

    expect(
      await screen.findByText("Email address is required"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("String must contain at least 2 character(s)"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("String must contain at least 8 character(s)"),
    ).toBeInTheDocument()
    expect(register.mutateAsync).not.toHaveBeenCalled()
  })

  it("creates an account and shows the verification notice", async () => {
    const user = userEvent.setup()
    const register = mutation()
    mockRegister.mockReturnValue(register)
    mockSearchString = "mode=register"

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Full Name *"), "Alexander Wright")
    await user.type(
      screen.getByLabelText("Email Address *"),
      "alex@example.com",
    )
    await user.type(
      screen.getByLabelText("Phone Number (Optional)"),
      "+251911234567",
    )
    await user.type(screen.getByLabelText("Password *"), "secret123")
    await user.click(screen.getByRole("button", { name: "Create Account" }))

    await waitFor(() =>
      expect(register.mutateAsync).toHaveBeenCalledWith({
        fullName: "Alexander Wright",
        email: "alex@example.com",
        phone: "+251911234567",
        password: "secret123",
      }),
    )
    expect(await screen.findByText("Verify Your Email")).toBeInTheDocument()
    expect(screen.getByText("alex@example.com")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Proceed to Sign In" }),
    ).toBeInTheDocument()
  })

  it("requests a password reset link", async () => {
    const user = userEvent.setup()
    const forgot = mutation()
    mockForgot.mockReturnValue(forgot)
    mockSearchString = "mode=forgot"

    render(<AuthPage />)

    expect(
      screen.getByRole("heading", { name: "Reset Password" }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).not.toBeInTheDocument()

    await user.type(
      screen.getByLabelText("Registered Email"),
      "guest@example.com",
    )
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    await waitFor(() =>
      expect(forgot.mutateAsync).toHaveBeenCalledWith({
        email: "guest@example.com",
      }),
    )
    expect(await screen.findByText("Check Your Email")).toBeInTheDocument()
    expect(
      screen.getByText(
        "We have dispatched password reset instructions to your email address.",
      ),
    ).toBeInTheDocument()
  })

  it("rejects a malformed email in the forgot password form", async () => {
    const user = userEvent.setup()
    const forgot = mutation()
    mockForgot.mockReturnValue(forgot)
    mockSearchString = "mode=forgot"

    render(<AuthPage />)
    await user.type(screen.getByLabelText("Registered Email"), "foo@bar")
    await user.click(screen.getByRole("button", { name: "Send Reset Link" }))

    expect(
      await screen.findByText("Invalid email address format"),
    ).toBeInTheDocument()
    expect(forgot.mutateAsync).not.toHaveBeenCalled()
  })

  it("redirects an already signed-in visitor to the returnTo destination", async () => {
    mockSearchString = `returnTo=${encodeURIComponent("/trips")}`
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

    render(<AuthPage />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/trips"))
  })

  it("sends a customer to the dashboard when returnTo is a forbidden portal", async () => {
    mockSearchString = `returnTo=${encodeURIComponent("/admin")}`
    useAuth
      .getState()
      .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

    render(<AuthPage />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"))
  })

  it("falls back to the role home when returnTo is malformed or external", async () => {
    for (const value of ["%", "//attacker.example/sign-in"]) {
      jest.clearAllMocks()
      mockSearchString = `returnTo=${encodeURIComponent(value)}`
      useAuth
        .getState()
        .setSession({ user: CUSTOMER, accessToken: "a", refreshToken: "r" })

      const { unmount } = render(<AuthPage />)
      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith("/dashboard"),
      )
      unmount()
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
    }
  })
})
