import { render, screen } from "@testing-library/react";
import AnalyticsDashboard from "./AnalyticsDashboard";

test("renders charts when expense entries exist", () => {
  const entries = [
    {
      id: 1,
      title: "Food",
      amount: 5000,
      category: "Food",
      date: "2026-07-11",
      type: "expense",
    },
  ];

  render(<AnalyticsDashboard entries={entries} />);

  expect(screen.getByText("Smart Analytics Dashboard")).toBeInTheDocument();
  expect(screen.getByText("Monthly spending trend")).toBeInTheDocument();
  expect(screen.getByText("Category-wise spending")).toBeInTheDocument();
  expect(document.querySelectorAll(".ad-vbar-fill").length).toBeGreaterThan(0);
});
