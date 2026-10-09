import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AIChat from "@/components/AIChat"
import { useAuth } from "@/lib/auth-store"

jest.mock("next/dynamic", () => {
  const React = require("react")
  return {
    __esModule: true,
    default: () => {
      const DynamicStub = (props: Record<string, unknown>) =>
        React.createElement(
          "div",
          {
            "data-testid": "ai-chat-panel",
            "data-initial-open": String(Boolean(props.initialOpen)),
            "data-variant": String(props.variant ?? "floating"),
            "data-hotel-id": String(props.hotelId ?? ""),
          },
          [
            React.createElement(
              "span",
              { key: "placeholder", "data-testid": "stub-placeholder" },
              String(props.placeholder ?? ""),
            ),
            props.onClose
              ? React.createElement(
                  "button",
                  {
                    key: "close",
                    "data-testid": "panel-close",
                    onClick: props.onClose,
                  },
                  "close",
                )
              : null,
          ],
        )
      return DynamicStub
    },
  }
})

const setTokens = (
  tokens: { accessToken: string ;refreshToken: string } | null,
) => {
  useAuth.setState({
    user: tokens
      ? {
          id: "u-1",
          email: "a@b.c",
          fullName: "Ada",
          role: "CUSTOMER",
          isActive: true,
          createdAt: "2025-01-01T00:00:00.000Z",
        }
      : null,
    tokens,
    loading: false,
    isInitialized: true,
    isAdmin: false,
    isManager: false,
    isStaff: false,
    isCustomer: Boolean(tokens),
  })
}

describe("AIChat", () => {
  beforeEach(() => {
    localStorage.clear()
    setTokens(null)
  })

  it("renders nothing for anonymous visitors", () => {
    const { container } = render(<AIChat />)
    expect(container).toBeEmptyDOMElement()
  })

  it("shows the launcher button and opens the panel", async () => {
    const user = userEvent.setup()
    setTokens({ accessToken: "a", refreshToken: "r" })
    render(<AIChat />)

    const launcher = screen.getByRole("button", {
      name: "Open AI travel assistant",
    })
    expect(launcher).toHaveTextContent("Ask LuxStay AI")
    expect(screen.queryByTestId("ai-chat-panel")).not.toBeInTheDocument()

    await user.click(launcher)

    expect(
      screen.queryByRole("button", { name: "Open AI travel assistant" }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId("ai-chat-panel")).toBeInTheDocument()
    expect(screen.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-initial-open",
      "true",
    )
    expect(screen.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-variant",
      "floating",
    )
  })

  it("closes the panel again through the panel close control", async () => {
    const user = userEvent.setup()
    setTokens({ accessToken: "a", refreshToken: "r" })
    render(<AIChat />)

    await user.click(
      screen.getByRole("button", { name: "Open AI travel assistant" }),
    )
    expect(screen.getByTestId("ai-chat-panel")).toBeInTheDocument()

    await user.click(screen.getByTestId("panel-close"))

    expect(screen.queryByTestId("ai-chat-panel")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open AI travel assistant" }),
    ).toBeInTheDocument()
  })

  it("renders the panel inline without a launcher", () => {
    setTokens({ accessToken: "a", refreshToken: "r" })
    render(<AIChat variant="inline" hotelId="h-9" placeholder="Ask me" />)

    expect(
      screen.queryByRole("button", { name: "Open AI travel assistant" }),
    ).not.toBeInTheDocument()
    const panel = screen.getByTestId("ai-chat-panel")
    expect(panel).toHaveAttribute("data-variant", "inline")
    expect(panel).toHaveAttribute("data-initial-open", "true")
    expect(panel).toHaveAttribute("data-hotel-id", "h-9")
    expect(screen.getByTestId("stub-placeholder")).toHaveTextContent("Ask me")
  })

  it("still starts closed for the floating variant even when initialOpen is set", async () => {
    const user = userEvent.setup()
    setTokens({ accessToken: "a", refreshToken: "r" })
    render(<AIChat initialOpen />)

    expect(screen.queryByTestId("ai-chat-panel")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open AI travel assistant" }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Open AI travel assistant" }),
    )

    expect(screen.getByTestId("ai-chat-panel")).toHaveAttribute(
      "data-initial-open",
      "true",
    )

    await user.click(screen.getByTestId("panel-close"))

    expect(screen.queryByTestId("ai-chat-panel")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open AI travel assistant" }),
    ).toBeInTheDocument()
  })
})
