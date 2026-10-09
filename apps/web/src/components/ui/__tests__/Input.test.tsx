import { createRef, useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Input } from "@/components/ui/Input"

function ControlledInput() {
  const [value, setValue] = useState("")
  return (
    <Input
      label="Email"
      placeholder="you@example.com"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

describe("Input", () => {
  it("renders an input with a placeholder and forwards native attributes", () => {
    render(<Input placeholder="Search rooms" name="query" />)

    const input = screen.getByPlaceholderText("Search rooms")
    expect(input).toHaveAttribute("name", "query")
    expect(input.tagName).toBe("INPUT")
  })

  it("associates its label with a generated id", () => {
    render(<Input label="Email" />)

    const input = screen.getByLabelText("Email")
    expect(input.id).toBeTruthy()
    expect(screen.getByText("Email")).toHaveAttribute("for", input.id)
  })

  it("uses a provided id for the field and its messages", () => {
    render(<Input id="booking-code" label="Code" error="Required" />)

    const input = screen.getByLabelText("Code")
    expect(input).toHaveAttribute("id", "booking-code")
    expect(screen.getByRole("alert")).toHaveAttribute(
      "id",
      "booking-code-error",
    )
    expect(input).toHaveAttribute("aria-describedby", "booking-code-error")
  })

  it("accepts typing as a controlled field", async () => {
    const user = userEvent.setup()

    render(<ControlledInput />)
    const input = screen.getByLabelText("Email")

    await user.type(input, "abebe@example.com")

    expect(input).toHaveValue("abebe@example.com")
  })

  it("fires onChange while typing", async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(<Input label="Email" onChange={onChange} />)
    await user.type(screen.getByLabelText("Email"), "ab")

    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it("links helper text and reports a valid state", () => {
    render(<Input label="Password" helperText="At least 8 characters" />)

    const input = screen.getByLabelText("Password")
    const helper = screen.getByText("At least 8 characters")

    expect(helper.id).toBe(`${input.id}-helper`)
    expect(input).toHaveAttribute("aria-describedby", helper.id)
    expect(input).toHaveAttribute("aria-invalid", "false")
  })

  it("shows an error alert and marks the input invalid", () => {
    render(<Input label="Email" error="Required field" />)

    const input = screen.getByLabelText("Email")
    const alert = screen.getByRole("alert")

    expect(alert).toHaveTextContent("Required field")
    expect(alert.id).toBe(`${input.id}-error`)
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("aria-describedby", alert.id)
  })

  it("lets the error win over the helper text", () => {
    render(
      <Input
        label="Email"
        helperText="We never share it"
        error="Invalid address"
      />,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Invalid address")
    expect(screen.queryByText("We never share it")).not.toBeInTheDocument()
  })

  it("omits aria-describedby without helper or error text", () => {
    render(<Input label="Email" />)

    expect(screen.getByLabelText("Email")).not.toHaveAttribute(
      "aria-describedby",
    )
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("renders left and right icons with matching padding", () => {
    render(
      <Input
        label="Search"
        leftIcon={<span data-testid="left" />}
        rightIcon={<span data-testid="right" />}
      />,
    )

    const input = screen.getByLabelText("Search")
    expect(screen.getByTestId("left")).toBeInTheDocument()
    expect(screen.getByTestId("right")).toBeInTheDocument()
    expect(input.className).toContain("pl-10")
    expect(input.className).toContain("pr-10")
  })

  it("keeps default padding when no icons are given", () => {
    render(<Input label="Search" />)

    const input = screen.getByLabelText("Search")
    expect(input.className).toContain("pl-4")
    expect(input.className).toContain("pr-4")
  })

  it("disables the field so typing has no effect", async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()

    render(<Input label="Email" disabled onChange={onChange} />)
    const input = screen.getByLabelText("Email")

    expect(input).toBeDisabled()

    await user.type(input, "abc")

    expect(input).toHaveValue("")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("merges custom class names onto the input", () => {
    render(<Input label="Email" className="my-extra" />)

    expect(screen.getByLabelText("Email")).toHaveClass("my-extra", "rounded-xl")
  })

  it("forwards its ref to the input element", () => {
    const ref = createRef<HTMLInputElement>()

    render(<Input ref={ref} label="Email" />)

    expect(ref.current).toBe(screen.getByLabelText("Email"))
  })
})
