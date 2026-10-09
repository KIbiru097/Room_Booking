import { render, screen, fireEvent } from "@testing-library/react"
import { PriceRangeSlider } from "@/components/forms/PriceRangeSlider"

describe("PriceRangeSlider", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders formatted currency bounds", () => {
    render(<PriceRangeSlider value={[10000, 50000]} onChange={jest.fn()} />)

    expect(screen.getByText("ETB 10,000")).toBeInTheDocument()
    expect(screen.getByText("ETB 50,000")).toBeInTheDocument()
    expect(screen.getByText("to")).toBeInTheDocument()
  })

  it("marks the upper bound with a plus when it reaches the maximum", () => {
    render(<PriceRangeSlider value={[0, 100000]} onChange={jest.fn()} />)

    expect(screen.getByText("ETB 0")).toBeInTheDocument()
    expect(screen.getByText("ETB 100,000+")).toBeInTheDocument()
  })

  it("omits the plus marker below the maximum", () => {
    render(<PriceRangeSlider value={[0, 99000]} onChange={jest.fn()} />)

    expect(screen.getByText("ETB 99,000")).toBeInTheDocument()
    expect(screen.queryByText("ETB 99,000+")).not.toBeInTheDocument()
  })

  it("exposes the default range constraints on the input", () => {
    render(<PriceRangeSlider value={[20000, 60000]} onChange={jest.fn()} />)

    const slider = screen.getByLabelText("Maximum price per night")
    expect(slider).toHaveAttribute("type", "range")
    expect(slider).toHaveAttribute("min", "0")
    expect(slider).toHaveAttribute("max", "100000")
    expect(slider).toHaveAttribute("step", "1000")
    expect(slider).toHaveValue("60000")
    expect(slider).toHaveAttribute("aria-valuemin", "0")
    expect(slider).toHaveAttribute("aria-valuemax", "100000")
    expect(slider).toHaveAttribute("aria-valuenow", "60000")
  })

  it("honours custom min, max and step values", () => {
    render(
      <PriceRangeSlider
        min={500}
        max={2000}
        step={50}
        value={[500, 1500]}
        onChange={jest.fn()}
      />,
    )

    const slider = screen.getByLabelText("Maximum price per night")
    expect(slider).toHaveAttribute("min", "500")
    expect(slider).toHaveAttribute("max", "2000")
    expect(slider).toHaveAttribute("step", "50")
  })

  it("reports an upper value that stays at or above the current lower bound", () => {
    const onChange = jest.fn()
    render(<PriceRangeSlider value={[50000, 80000]} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Maximum price per night"), {
      target: { value: "90000" },
    })

    expect(onChange).toHaveBeenCalledWith([50000, 90000])
  })

  it("accepts a value equal to the current lower bound", () => {
    const onChange = jest.fn()
    render(<PriceRangeSlider value={[50000, 80000]} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Maximum price per night"), {
      target: { value: "50000" },
    })

    expect(onChange).toHaveBeenCalledWith([50000, 50000])
  })

  it("rejects an upper value below the current lower bound", () => {
    const onChange = jest.fn()
    render(<PriceRangeSlider value={[50000, 80000]} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText("Maximum price per night"), {
      target: { value: "49000" },
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it("applies extra classes to its wrapper", () => {
    const { container } = render(
      <PriceRangeSlider
        value={[0, 100]}
        onChange={jest.fn()}
        className="extra-wrapper"
      />,
    )

    expect(container.firstElementChild?.className).toContain("extra-wrapper")
    expect(container.firstElementChild?.className).toContain("space-y-3")
  })
})
