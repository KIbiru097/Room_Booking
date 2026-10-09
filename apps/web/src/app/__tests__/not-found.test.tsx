import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import NotFound from "@/app/not-found"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/does-not-exist",
  useParams: () => ({ id: "1" }),
  useSearchParams: () => new URLSearchParams("city=Addis"),
}))

describe("NotFound page", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = ""
  })

  it("shows the 404 status and the translated explanation", () => {
    render(<NotFound />)

    expect(screen.getByText("404")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Page not found", level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Sorry, we couldn't find the page you're looking for. It may have been moved or doesn't exist.",
      ),
    ).toBeInTheDocument()
  })

  it("links back to the home page", async () => {
    const user = userEvent.setup()
    render(<NotFound />)

    const backHome = screen.getByRole("link", { name: "Back to Home" })
    expect(backHome).toHaveAttribute("href", "/")

    await user.click(backHome)
    expect(backHome).toBeInTheDocument()
  })
})
