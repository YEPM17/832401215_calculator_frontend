export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function normalizeExpression(value) {
  return String(value)
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .trim();
}

export function createApiClient(
  baseUrl,
  fetchImpl = globalThis.fetch,
) {
  const root = String(baseUrl).replace(/\/+$/, '');

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetchImpl(`${root}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
    } catch (error) {
      throw new ApiError('Cannot connect to backend', 0);
    }

    if (response.status === 204) {
      return null;
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new ApiError('Invalid server response', response.status);
    }

    if (!response.ok || payload.success === false) {
      throw new ApiError(payload.message || 'Request failed', response.status);
    }
    return payload;
  }

  return {
    async calculate(expression) {
      return request('/api/calculate', {
        method: 'POST',
        body: JSON.stringify({ expression: normalizeExpression(expression) }),
      });
    },
    async getHistory() {
      const payload = await request('/api/history');
      return payload.items;
    },
    async deleteHistory(recordId) {
      return request(`/api/history/${encodeURIComponent(recordId)}`, {
        method: 'DELETE',
      });
    },
  };
}
