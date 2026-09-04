import { render, screen, waitFor } from "@testing-library/react";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { getDashboard } from "./api";

jest.mock("./api", () => ({
  getDashboard: jest.fn(),
}));

test("renders charts when expense entries exist", async () => {
  getDashboard.mockResolvedValue({
    year: 2026,
    hasEntries: true,
    selectedMonthKey: "2026-07",
    availableMonthKeys: ["2026-07"],
    currentMonthExpenseTotal: 5000,
    currentMonthIncomeTotal: 0,
    selectedMonthExpenseTotal: 5000,
    selectedMonthIncomeTotal: 0,
    monthlySpending: [{ key: "2026-07", label: "Jul", value: 5000 }],
    monthlyIncome: [{ key: "2026-07", label: "Jul", value: 0 }],
    selectedMonthCategoryRows: [{ key: "Food", label: "Food", value: 5000 }],
    selectedMonthIncomeRows: [],
    categorySpendingAllTime: [{ key: "Food", label: "Food", value: 5000 }],
    incomeVsExpense: { income: 0, expense: 5000, balance: -5000 },
  });

  render(<AnalyticsDashboard />);

  expect(await screen.findByText("Smart Analytics Dashboard")).toBeInTheDocument();
  expect(screen.getByText("Monthly spending trend")).toBeInTheDocument();
  expect(screen.getByText("Category-wise spending")).toBeInTheDocument();
  await waitFor(() => {
    expect(document.querySelectorAll(".ad-vbar-fill").length).toBeGreaterThan(0);
  });
});
