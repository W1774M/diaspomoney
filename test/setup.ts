import "@testing-library/jest-dom";
import matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Étend les matchers de Vitest avec ceux de jest-dom
expect.extend(matchers);

// Nettoie après chaque test
afterEach(() => {
  cleanup();
});
