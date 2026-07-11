// CRA uses build-time env vars with the `REACT_APP_` prefix (optional `frontend/.env`).
export const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/entries\/?$/, "")
    : "http://localhost:5000");

const API_URL = `${API_BASE}/entries`;

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error(
      'Cannot reach the server. Check your connection or wait a moment if the backend just woke up.'
    );
  }
  return res;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function getEntries() {
  const res = await request(API_URL, {
    headers: getAuthHeaders()
  });
  
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized - Please login again');
  }
  
  if (!res.ok) {
    throw new Error('Failed to fetch entries');
  }

  return res.json();
}

export async function addEntry(entry) {
  const res = await request(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });
  
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized - Please login again');
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to add entry');
  }
  
  return res.json();
}

export async function updateEntry(id, entry) {
  const res = await request(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });
  
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized - Please login again');
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to update entry');
  }

  return res.json();
}

export async function deleteEntry(id) {
  const res = await request(`${API_URL}/${id}`, { 
    method: "DELETE",
    headers: getAuthHeaders()
  });
  
  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized - Please login again');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to delete entry');
  }
} 