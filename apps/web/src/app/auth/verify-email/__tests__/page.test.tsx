import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import VerifyEmailPage from "@/app/auth/verify-email/page"
import { authApi } from "@/lib/services"

let mockSearchString = "token=verify-token-abc"
const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/auth/verify-email",
  useSearchParams: () => new URLSearchParams(mockSearchString),
  useParams: () => ({}),
}))

jest.mock("@/lib/services", () => ({
  authApi: {
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
  },
}))

const mockVerify = authApi.verifyEmail as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockSearchString = "token=verify-token-abc"
  mockVerify.mockResolvedValue({ message: "verified" })
})

describe("verify email page", () => {
  it("verifies the token and shows the success state", async () => {
    render(<VerifyEmailPage />)

    expect(
      await screen.findByRole("heading", { name: "Email Verified" }),
    ).toBeInTheDocument()
    expect(mockVerify).toHaveBeenCalledWith("verify-token-abc")
    expect(
      screen.getByText(
        "Your email address has been confirmed. Your account is now fully active and ready to book luxury stays across Ethiopia.",
      ),
    ).toBeInTheDocument()
  })

  it("routes to sign in after a successful verification", async () => {
    const user = userEvent.setup()
    render(<VerifyEmailPage />)

    await user.click(
      await screen.findByRole("button", { name: /Sign In to Your Account/ }),
    )

    expect(mockPush).toHaveBeenCalledWith("/auth")
  })

  it("shows a failure state when no token is present", async () => {
    mockSearchString = ""
    render(<VerifyEmailPage />)

    expect(
      await screen.findByRole("heading", { name: "Verification Failed" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("No verification token was provided in the link."),
    ).toBeInTheDocument()
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it("shows the API error when verification fails", async () => {
    mockVerify.mockRejectedValue(
      new Error("Invalid or expired verification link."),
    )
    render(<VerifyEmailPage />)

    expect(
      await screen.findByRole("heading", { name: "Verification Failed" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Invalid or expired verification link."),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Email Verified" }),
    ).not.toBeInTheDocument()
  })

  it("offers a back to sign in action on failure", async () => {
    const user = userEvent.setup()
    mockVerify.mockRejectedValue(
      new Error("Invalid or expired verification link."),
    )
    render(<VerifyEmailPage />)

    await user.click(
      await screen.findByRole("button", { name: /Back to Sign In/ }),
    )

    expect(mockPush).toHaveBeenCalledWith("/auth")
  })

  it("keeps a loading state while the verification request is pending", async () => {
    let resolveRequest: (value: { message: string }) => void = () => undefined
    mockVerify.mockReturnValue(
      new Promise<{ message: string }>((resolve) => {
        resolveRequest = resolve
      }),
    )

    render(<VerifyEmailPage />)

    expect(
      await screen.findByRole("heading", { name: "Verifying Your Email" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Please wait while we verify your LuxStay account..."),
    ).toBeInTheDocument()
    expect(mockVerify).toHaveBeenCalledWith("verify-token-abc")

    await act(async () => {
      resolveRequest({ message: "verified" })
    })

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Email Verified" }),
      ).toBeInTheDocument(),
    )
  })
})
