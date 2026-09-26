import { createApiClient } from './api.js';

export function createCalculatorApp({ api, elements, documentRef }) {
  function setStatus(text, state) {
    elements.statusBadge.textContent = text;
    elements.statusBadge.className = `status status--${state}`;
  }

  function renderHistory(items) {
    elements.historyList.replaceChildren();
    if (items.length === 0) {
      const empty = documentRef.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No calculation history yet.';
      elements.historyList.append(empty);
      return;
    }

    for (const item of items) {
      const row = documentRef.createElement('article');
      row.className = 'history-item';

      const content = documentRef.createElement('div');
      content.className = 'history-item__content';

      const expression = documentRef.createElement('p');
      expression.className = 'history-item__expression';
      expression.textContent = item.expression;

      const result = documentRef.createElement('p');
      result.className = 'history-item__result';
      result.textContent = `= ${item.result}`;

      const remove = documentRef.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-button';
      remove.setAttribute('aria-label', `Delete ${item.expression}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => deleteRecord(item.id));

      content.append(expression, result);
      row.append(content, remove);
      elements.historyList.append(row);
    }
  }

  async function loadHistory() {
    try {
      const items = await api.getHistory();
      renderHistory(items);
      setStatus('Backend online', 'online');
    } catch (error) {
      renderHistory([]);
      setStatus(error.message, 'offline');
    }
  }

  async function calculate() {
    elements.errorMessage.textContent = '';
    elements.resultValue.textContent = '';
    elements.calculateButton.disabled = true;
    try {
      const payload = await api.calculate(elements.expressionInput.value);
      elements.resultValue.textContent = String(payload.result);
      await loadHistory();
    } catch (error) {
      elements.errorMessage.textContent = error.message;
    } finally {
      elements.calculateButton.disabled = false;
    }
  }

  async function deleteRecord(recordId) {
    elements.errorMessage.textContent = '';
    try {
      await api.deleteHistory(recordId);
      await loadHistory();
    } catch (error) {
      elements.errorMessage.textContent = error.message;
    }
  }

  function appendToken(token) {
    elements.expressionInput.value += token;
    elements.expressionInput.focus?.();
  }

  function clearExpression() {
    elements.expressionInput.value = '';
    elements.resultValue.textContent = '';
    elements.errorMessage.textContent = '';
    elements.expressionInput.focus?.();
  }

  function backspace() {
    elements.expressionInput.value = elements.expressionInput.value.slice(0, -1);
    elements.expressionInput.focus?.();
  }

  function bind() {
    documentRef.querySelector?.('#calculator-form')?.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        calculate();
      },
    );
    documentRef.querySelector?.('#refresh-history')?.addEventListener(
      'click',
      loadHistory,
    );
    documentRef.querySelectorAll?.('[data-token]').forEach((button) => {
      button.addEventListener('click', () => appendToken(button.dataset.token));
    });
    documentRef.querySelector?.('[data-action="clear"]')?.addEventListener(
      'click',
      clearExpression,
    );
    documentRef.querySelector?.('[data-action="backspace"]')?.addEventListener(
      'click',
      backspace,
    );
    elements.expressionInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        calculate();
      }
    });
  }

  return {
    elements,
    bind,
    calculate,
    loadHistory,
    deleteRecord,
    appendToken,
    clearExpression,
    backspace,
    renderHistory,
  };
}

const apiBaseUrl = globalThis.CALCULATOR_API_BASE_URL
  || 'http://127.0.0.1:8000';

if (typeof document !== 'undefined') {
  const app = createCalculatorApp({
    api: createApiClient(apiBaseUrl),
    elements: {
      expressionInput: document.querySelector('#expression'),
      resultValue: document.querySelector('#result'),
      errorMessage: document.querySelector('#error'),
      historyList: document.querySelector('#history-list'),
      calculateButton: document.querySelector('#calculate'),
      statusBadge: document.querySelector('#status'),
    },
    documentRef: document,
  });
  app.bind();
  app.loadHistory();
  globalThis.calculatorApp = app;
}
