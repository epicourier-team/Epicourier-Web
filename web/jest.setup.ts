import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";
Object.assign(global, {
  TextEncoder,
  TextDecoder,
});

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
