import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);
Object.defineProperty(window, 'matchMedia', { writable: true, value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
