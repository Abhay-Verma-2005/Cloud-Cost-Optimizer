const API_URL = '';

export const api = {
  async login(username, password) {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  },

  async signup(username, password, email) {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    return response.json();
  },

  async analyzeAWS(awsAccessKey, awsSecretKey, options = {}) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ awsAccessKey, awsSecretKey, ...options })
    });
    return response.json();
  },

  async getHistory() {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  async askAI(question) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/ai-advisor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ question })
    });
    return response.json();
  },

  async stopInstance(instanceId) {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/api/stop-instance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ instanceId })
    });
    return response.json();
  }
};

export default api;
