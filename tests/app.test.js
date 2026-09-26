import assert from 'node:assert/strict';
import test from 'node:test';

import { createCalculatorApp } from '../js/app.js';

function makeElement() {
  return {
    value: '',
    textContent: '',
    disabled: false,
    className: '',
    dataset: {},
    children: [],
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    replaceChildren(...children) {
      this.children = children;
    },
    append(...children) {
      this.children.push(...children);
    },
    setAttribute(name, value) {
      this[name] = value;
    },
  };
}

function makeElements() {
  return {
    expressionInput: makeElement(),
    resultValue: makeElement(),
    errorMessage: makeElement(),
    historyList: makeElement(),
    calculateButton: makeElement(),
    statusBadge: makeElement(),
  };
}

function makeDocument() {
  return {
    createElement(tagName) {
      const element = makeElement();
      element.tagName = tagName;
      return element;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

test('calculate uses backend result and reloads history', async () => {
  const calls = [];
  const api = {
    async calculate(expression) {
      calls.push(['calculate', expression]);
      return { result: 9 };
    },
    async getHistory() {
      calls.push(['history']);
      return [];
    },
  };
  const app = createCalculatorApp({
    api,
    elements: makeElements(),
    documentRef: makeDocument(),
  });
  app.elements.expressionInput.value = '(1+2)*3';

  await app.calculate();

  assert.equal(app.elements.resultValue.textContent, '9');
  assert.deepEqual(calls, [['calculate', '(1+2)*3'], ['history']]);
});

test('backend error is shown without local result', async () => {
  const api = {
    async calculate() {
      throw new Error('Division by zero');
    },
    async getHistory() {
      return [];
    },
  };
  const app = createCalculatorApp({
    api,
    elements: makeElements(),
    documentRef: makeDocument(),
  });
  app.elements.expressionInput.value = '1/0';
  app.elements.resultValue.textContent = 'old';

  await app.calculate();

  assert.equal(app.elements.resultValue.textContent, '');
  assert.equal(app.elements.errorMessage.textContent, 'Division by zero');
});

test('deleteRecord refreshes history from backend', async () => {
  const calls = [];
  const api = {
    async deleteHistory(id) {
      calls.push(['delete', id]);
    },
    async getHistory() {
      calls.push(['history']);
      return [];
    },
  };
  const app = createCalculatorApp({
    api,
    elements: makeElements(),
    documentRef: makeDocument(),
  });

  await app.deleteRecord(7);

  assert.deepEqual(calls, [['delete', 7], ['history']]);
});
