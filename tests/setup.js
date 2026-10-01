/**
 * Shared test setup.
 *
 * `@testing-library/jest-dom` adds the custom matchers (toBeInTheDocument,
 * toHaveAccessibleName, …). Anything a DOM test needs globally goes here.
 */
require('@testing-library/jest-dom');

// jsdom does not implement matchMedia, which the testimonials slider reads to
// honour prefers-reduced-motion.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Keep the console readable: React Router/Next emit a benign warning about the
// future of <Image> sizes in some jsdom versions.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});