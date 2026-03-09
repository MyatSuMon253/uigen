import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor ---

test("shows 'Creating {filename}' for str_replace_editor create command", () => {
  const tool: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/components/Card.jsx" },
    state: "result",
    result: "ok",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
});

test("shows 'Editing {filename}' for str_replace_editor str_replace command", () => {
  const tool: ToolInvocation = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "src/App.jsx" },
    state: "result",
    result: "ok",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("shows 'Editing {filename}' for str_replace_editor insert command", () => {
  const tool: ToolInvocation = {
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "src/utils/helpers.ts" },
    state: "result",
    result: "ok",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Editing helpers.ts")).toBeDefined();
});

test("shows 'Viewing {filename}' for str_replace_editor view command", () => {
  const tool: ToolInvocation = {
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "src/index.tsx" },
    state: "call",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Viewing index.tsx")).toBeDefined();
});

test("shows 'Creating file' when path is missing for create command", () => {
  const tool: ToolInvocation = {
    toolCallId: "5",
    toolName: "str_replace_editor",
    args: { command: "create" },
    state: "call",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

test("shows 'Processing file' for str_replace_editor with no args", () => {
  const tool: ToolInvocation = {
    toolCallId: "6",
    toolName: "str_replace_editor",
    args: {},
    state: "call",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Processing file")).toBeDefined();
});

// --- file_manager ---

test("shows 'Renaming {old} to {new}' for file_manager rename command", () => {
  const tool: ToolInvocation = {
    toolCallId: "7",
    toolName: "file_manager",
    args: { command: "rename", path: "src/Old.jsx", new_path: "src/New.jsx" },
    state: "result",
    result: { success: true },
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Renaming Old.jsx to New.jsx")).toBeDefined();
});

test("shows 'Deleting {filename}' for file_manager delete command", () => {
  const tool: ToolInvocation = {
    toolCallId: "8",
    toolName: "file_manager",
    args: { command: "delete", path: "src/Unused.css" },
    state: "result",
    result: { success: true },
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Deleting Unused.css")).toBeDefined();
});

test("shows 'Renaming file' when new_path is missing", () => {
  const tool: ToolInvocation = {
    toolCallId: "9",
    toolName: "file_manager",
    args: { command: "rename", path: "src/Old.jsx" },
    state: "call",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("Renaming file")).toBeDefined();
});

// --- unknown tool ---

test("falls back to toolName for unknown tools", () => {
  const tool: ToolInvocation = {
    toolCallId: "10",
    toolName: "some_custom_tool",
    args: {},
    state: "call",
  };
  render(<ToolInvocationBadge tool={tool} />);
  expect(screen.getByText("some_custom_tool")).toBeDefined();
});

// --- state indicators ---

test("shows green dot when tool is done (state=result)", () => {
  const tool: ToolInvocation = {
    toolCallId: "11",
    toolName: "str_replace_editor",
    args: { command: "create", path: "App.jsx" },
    state: "result",
    result: "ok",
  };
  const { container } = render(<ToolInvocationBadge tool={tool} />);
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when tool is in progress (state=call)", () => {
  const tool: ToolInvocation = {
    toolCallId: "12",
    toolName: "str_replace_editor",
    args: { command: "create", path: "App.jsx" },
    state: "call",
  };
  const { container } = render(<ToolInvocationBadge tool={tool} />);
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});
