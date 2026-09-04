// CRA uses build-time env vars with the `REACT_APP_` prefix (optional `frontend/.env`).
export const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/entries\/?$/, "")
    : "http://localhost:5000");

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Check your connection or wait a moment if the backend just woke up."
    );
  }
  return res;
}

async function parseError(res, fallback) {
  const errorData = await res.json().catch(() => ({ error: fallback }));
  throw new Error(errorData.error || fallback);
}

function assertAuth(res) {
  if (res.status === 401 || res.status === 403) {
    throw new Error("Unauthorized - Please login again");
  }
}

export async function register(payload) {
  const res = await request(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res, "Registration failed");
  return res.json();
}

export async function login(payload) {
  const res = await request(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return parseError(res, "Login failed");
  return res.json();
}

export async function logout() {
  await request(`${API_BASE}/auth/logout`, { method: "POST" });
}

export async function getMe() {
  const res = await request(`${API_BASE}/auth/me`);
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) return parseError(res, "Failed to load session");
  return res.json();
}

export async function getEntries(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null)
  ).toString();
  const res = await request(`${API_BASE}/entries${qs ? `?${qs}` : ""}`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to fetch entries");
  return res.json();
}

export async function addEntry(entry) {
  const res = await request(`${API_BASE}/entries`, {
    method: "POST",
    body: JSON.stringify(entry),
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to add entry");
  return res.json();
}

export async function updateEntry(id, entry) {
  const res = await request(`${API_BASE}/entries/${id}`, {
    method: "PUT",
    body: JSON.stringify(entry),
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to update entry");
  return res.json();
}

export async function deleteEntry(id) {
  const res = await request(`${API_BASE}/entries/${id}`, { method: "DELETE" });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to delete entry");
}

export async function getSummary() {
  const res = await request(`${API_BASE}/analytics/summary`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to load summary");
  return res.json();
}

export async function getDashboard(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await request(`${API_BASE}/analytics/dashboard${qs}`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to load analytics");
  return res.json();
}

export async function getInsights() {
  const res = await request(`${API_BASE}/analytics/insights`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to load insights");
  return res.json();
}

export async function getBudget(month) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await request(`${API_BASE}/budgets${qs}`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to load budget");
  return res.json();
}

export async function saveBudget(payload) {
  const res = await request(`${API_BASE}/budgets`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to save budget");
  return res.json();
}

export async function getRecurring() {
  const res = await request(`${API_BASE}/recurring`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to load recurring transactions");
  return res.json();
}

export async function addRecurring(payload) {
  const res = await request(`${API_BASE}/recurring`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to add recurring transaction");
  return res.json();
}

export async function deleteRecurring(id) {
  const res = await request(`${API_BASE}/recurring/${id}`, { method: "DELETE" });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to delete recurring transaction");
}

export async function getGoals() {
  const res = await request(`${API_BASE}/goals`);
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to load goals");
  return res.json();
}

export async function addGoal(payload) {
  const res = await request(`${API_BASE}/goals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to add goal");
  return res.json();
}

export async function updateGoal(id, payload) {
  const res = await request(`${API_BASE}/goals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to update goal");
  return res.json();
}

export async function deleteGoal(id) {
  const res = await request(`${API_BASE}/goals/${id}`, { method: "DELETE" });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to delete goal");
}

export async function downloadReport(kind, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v)
  ).toString();
  const res = await fetch(`${API_BASE}/reports/${kind}${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  assertAuth(res);
  if (!res.ok) return parseError(res, "Failed to download report");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = kind === "pdf" ? "fintrack-report.pdf" : "fintrack-report.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
