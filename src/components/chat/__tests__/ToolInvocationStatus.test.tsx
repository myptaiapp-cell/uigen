import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolInvocationStatus } from "../ToolInvocationStatus";

describe("ToolInvocationStatus", () => {
  describe("str_replace_editor tool", () => {
    it("displays 'Creating' message for create command", () => {
      render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "create", path: "/components/Card.jsx" }}
          state="result"
          result={{ success: true }}
        />
      );

      expect(screen.getByText("Creating /components/Card.jsx")).toBeTruthy();
    });

    it("displays 'Editing' message for str_replace command", () => {
      render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "str_replace", path: "/App.jsx" }}
          state="result"
          result={{ success: true }}
        />
      );

      expect(screen.getByText("Editing /App.jsx")).toBeTruthy();
    });

    it("displays 'Editing' message for insert command", () => {
      render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "insert", path: "/utils.ts", insert_line: 5 }}
          state="result"
          result={{ success: true }}
        />
      );

      expect(screen.getByText("Editing /utils.ts")).toBeTruthy();
    });

    it("displays 'Viewing' message for view command", () => {
      render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "view", path: "/README.md" }}
          state="result"
          result={{ content: "..." }}
        />
      );

      expect(screen.getByText("Viewing /README.md")).toBeTruthy();
    });

    it("shows loading spinner when state is pending", () => {
      const { container } = render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "create", path: "/Button.tsx" }}
          state="pending"
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeTruthy();
    });
  });

  describe("file_manager tool", () => {
    it("displays 'Deleting' message for delete command", () => {
      render(
        <ToolInvocationStatus
          toolName="file_manager"
          args={{ command: "delete", path: "/old-file.js" }}
          state="result"
          result={{ success: true }}
        />
      );

      expect(screen.getByText("Deleting /old-file.js")).toBeTruthy();
    });

    it("displays rename message with arrow for rename command", () => {
      render(
        <ToolInvocationStatus
          toolName="file_manager"
          args={{
            command: "rename",
            path: "/components/OldName.jsx",
            new_path: "/components/NewName.jsx",
          }}
          state="result"
          result={{ success: true }}
        />
      );

      expect(screen.getByText(/Renaming.*OldName.*NewName/)).toBeTruthy();
    });
  });

  describe("completion state", () => {
    it("shows green checkmark indicator when complete", () => {
      const { container } = render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "create", path: "/test.tsx" }}
          state="result"
          result={{ success: true }}
        />
      );

      const indicator = container.querySelector(".bg-emerald-500");
      expect(indicator).toBeTruthy();
    });

    it("shows blue loading spinner when pending", () => {
      const { container } = render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "create", path: "/test.tsx" }}
          state="pending"
        />
      );

      const spinner = container.querySelector(".text-blue-600");
      expect(spinner).toBeTruthy();
      expect(spinner?.classList.contains("animate-spin")).toBe(true);
    });
  });

  describe("fallback behavior", () => {
    it("falls back to tool name when args are missing", () => {
      render(
        <ToolInvocationStatus toolName="str_replace_editor" state="result" result={{ success: true }} />
      );

      const allElements = screen.queryAllByText("str_replace_editor");
      expect(allElements.length).toBeGreaterThan(0);
    });

    it("falls back to tool name for unknown commands", () => {
      render(
        <ToolInvocationStatus
          toolName="str_replace_editor"
          args={{ command: "unknown_command", path: "/file.js" }}
          state="result"
          result={{ success: true }}
        />
      );

      const allElements = screen.queryAllByText("str_replace_editor");
      expect(allElements.length).toBeGreaterThan(0);
    });

    it("falls back to tool name for unknown tools", () => {
      render(
        <ToolInvocationStatus
          toolName="custom_tool"
          args={{ command: "do_something" }}
          state="result"
          result={{ success: true }}
        />
      );

      expect(screen.getByText("custom_tool")).toBeTruthy();
    });
  });
});
