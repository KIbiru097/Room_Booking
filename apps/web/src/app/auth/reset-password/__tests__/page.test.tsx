import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ResetPasswordPage from "@/app/auth/reset-password/page"
import { authApi } from "@/lib/services"

let mockSearchString = "token=reset-token-123"
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/auth/reset-password",
  useSearchParams: () => new URLSearchParams(mockSearchString),
  useParams: () => ({}),
}))

jest.mock("@/lib/services", () => ({
  authApi: {
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
  },
}))

const mockReset = authApi.resetPassword as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockSearchString = "token=reset-token-123"
  mockReset.mockResolvedValue({ message: "ok" })
})

function fill(password: string, confirm: string) {
  return { password, confirm }
}

async function typePasswords(
  user: ReturnType<typeof userEvent.setup>,
  { password, confirm }: { password: string ;confirm: string },
) {
  await user.type(screen.getByPlaceholderText("8+ characters"), password)
  await user.type(
    screen.getByPlaceholderText("Repeat your new password"),
    confirm,
  )
}

describe("reset password page", () => {
  it("renders the reset form", async () => {
    render(<ResetPasswordPage />)

    expect(
      await screen.findByRole("heading", { name: "Set New Password" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Create a strong, secure password for your LuxStay account.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText("8+ characters")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Repeat your new password"),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Update Password" }),
    ).toBeEnabled()
  })

  it("disables submission and explains the missing token", () => {
    mockSearchString = ""
    render(<ResetPasswordPage />)

    expect(
      screen.getByText(
        "Missing reset token. Please verify you clicked the complete link in your email.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Update Password" }),
    ).toBeDisabled()
  })

  it("rejects a password that is shorter than eight characters", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await typePasswords(user, fill("abc123", "abc123"))

    await user.click(screen.getByRole("button", { name: "Update Password" }))

    expect(
      await screen.findByText("Password must be at least 8 characters long."),
    ).toBeInTheDocument()
    expect(mockReset).not.toHaveBeenCalled()
  })

  it("rejects a password without a number", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await typePasswords(user, fill("abcdefgHIJ", "abcdefgHIJ"))

    await user.click(screen.getByRole("button", { name: "Update Password" }))

    expect(
      await screen.findByText("Password must contain at least one number."),
    ).toBeInTheDocument()
    expect(mockReset).not.toHaveBeenCalled()
  })

  it("rejects mismatched passwords", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await typePasswords(user, fill("secret123", "secret124"))

    await user.click(screen.getByRole("button", { name: "Update Password" }))

    expect(
      await screen.findByText("Passwords do not match."),
    ).toBeInTheDocument()
    expect(mockReset).not.toHaveBeenCalled()
  })

  it("resets the password and shows the success screen", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await typePasswords(user, fill("secret123", "secret123"))

    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await waitFor(() =>
      expect(mockReset).toHaveBeenCalledWith({
        token: "reset-token-123",
        password: "secret123",
      }),
    )
    expect(
      await screen.findByRole("heading", { name: "Password Reset Successful" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Your password has been updated securely. You can now sign in using your new credentials.",
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText("8+ characters"),
    ).not.toBeInTheDocument()
  })

  it("navigates to sign in from the success screen", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)
    await typePasswords(user, fill("secret123", "secret123"))
    await user.click(screen.getByRole("button", { name: "Update Password" }))

    await user.click(
      await screen.findByRole("button", { name: /Sign In to Your Account/ }),
    )

    expect(mockPush).toHaveBeenCalledWith("/auth")
  })

  it("surfaces the API failure message", async () => {
    const user = userEvent.setup()
    mockReset.mockRejectedValue(new Error("Reset link has expired"))
    render(<ResetPasswordPage />)
    await typePasswords(user, fill("secret123", "secret123"))

    await user.click(screen.getByRole("button", { name: "Update Password" }))

    expect(
      await screen.findByText("Reset link has expired"),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Password Reset Successful" }),
    ).not.toBeInTheDocument()
  })

  it("toggles password visibility for both fields", async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    const password = screen.getByPlaceholderText("8+ characters")
    const confirm = screen.getByPlaceholderText("Repeat your new password")
    expect(password).toHaveAttribute("type", "password")

    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")

    await user.click(
      screen.getByRole("button", { name: "Show confirm password" }),
    )
    expect(confirm).toHaveAttribute("type", "text")

    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")
  })
})
