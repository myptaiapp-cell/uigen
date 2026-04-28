"use client";

import { Loader2, CheckCircle2 } from "lucide-react";

interface ToolArgs {
  command?: string;
  path?: string;
  new_path?: string;
  [key: string]: any;
}

interface ToolInvocationStatusProps {
  toolName: string;
  args?: ToolArgs;
  state: "result" | "pending" | string;
  result?: any;
}

function getToolMessage(toolName: string, args?: ToolArgs): string {
  if (!args) return toolName;

  const command = args.command;
  const path = args.path;
  const newPath = args.new_path;

  if (toolName === "str_replace_editor") {
    if (command === "create" && path) {
      return `Creating ${path}`;
    } else if (command === "str_replace" && path) {
      return `Editing ${path}`;
    } else if (command === "insert" && path) {
      return `Editing ${path}`;
    } else if (command === "view" && path) {
      return `Viewing ${path}`;
    }
  } else if (toolName === "file_manager") {
    if (command === "delete" && path) {
      return `Deleting ${path}`;
    } else if (command === "rename" && path && newPath) {
      return `Renaming ${path} → ${newPath}`;
    }
  }

  return toolName;
}

export function ToolInvocationStatus({
  toolName,
  args,
  state,
  result,
}: ToolInvocationStatusProps) {
  const message = getToolMessage(toolName, args);
  const isComplete = state === "result" && result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
