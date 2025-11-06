import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AddMealModal from "../../../../../components/ui/AddMealModal";

// Mock fetch /api/foods
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        { id: 1, name: "Salmon", calories: 300 },
        { id: 2, name: "Broccoli", calories: 50 },
      ]),
  })
) as jest.Mock;

describe("AddMealModal", () => {
  it("renders correctly and allows selecting foods", async () => {
    render(<AddMealModal isOpen={true} onClose={jest.fn()} onSaved={jest.fn()} />);

    // wait for food load
    await waitFor(() => screen.getByPlaceholderText("Search foods..."));

    fireEvent.change(screen.getByPlaceholderText("Search foods..."), {
      target: { value: "salmon" },
    });

    await waitFor(() => screen.getByText(/Salmon/i));
    fireEvent.click(screen.getByText(/Salmon/i));

    expect(screen.getByText("Salmon")).toBeInTheDocument();
  });

  it("prevents selecting more than 5 foods", async () => {
    render(<AddMealModal isOpen={true} onClose={jest.fn()} onSaved={jest.fn()} />);

    await waitFor(() => screen.getByPlaceholderText("Search foods..."));

    for (let i = 0; i < 6; i++) {
      fireEvent.change(screen.getByPlaceholderText("Search foods..."), {
        target: { value: "broccoli" },
      });
      await waitFor(() => screen.getByText(/Broccoli/i));
      fireEvent.click(screen.getByText(/Broccoli/i));
    }

    // 預期顯示 alert
    expect(screen.getAllByText("Broccoli").length).toBeLessThanOrEqual(5);
  });
});
