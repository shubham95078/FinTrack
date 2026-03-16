const API_URL = "http://localhost:5000/entries";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function getEntries() {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  
  if (res.status === 401) {
    throw new Error('Unauthorized - Please login again');
  }
  
  return res.json();
}

export async function addEntry(entry) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });
  
  if (res.status === 401) {
    throw new Error('Unauthorized - Please login again');
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to add entry');
  }
  
  return res.json();
}

export async function updateEntry(id, entry) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(entry),
  });
  
  if (res.status === 401) {
    throw new Error('Unauthorized - Please login again');
  }
  
  return res.json();
}

export async function deleteEntry(id) {
  const res = await fetch(`${API_URL}/${id}`, { 
    method: "DELETE",
    headers: getAuthHeaders()
  });
  
  if (res.status === 401) {
    throw new Error('Unauthorized - Please login again');
  }
} 