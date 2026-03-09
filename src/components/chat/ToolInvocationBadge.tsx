"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  tool: ToolInvocation;
}

function getToolLabel(tool: ToolInvocation): string {
  const args = tool.args as Record<string, unknown>;

  if (tool.toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const path = args.path as string | undefined;
    const filename = path ? path.split("/").pop() : undefined;

    switch (command) {
      case "create":
        return filename ? `Creating ${filename}` : "Creating file";
      case "str_replace":
      case "insert":
        return filename ? `Editing ${filename}` : "Editing file";
      case "view":
        return filename ? `Viewing ${filename}` : "Viewing file";
      default:
        return filename ? `Processing ${filename}` : "Processing file";
    }
  }

  if (tool.toolName === "file_manager") {
    const command = args.command as string | undefined;
    const path = args.path as string | undefined;
    const newPath = args.new_path as string | undefined;
    const filename = path ? path.split("/").pop() : undefined;
    const newFilename = newPath ? newPath.split("/").pop() : undefined;

    switch (command) {
      case "rename":
        return filename && newFilename
          ? `Renaming ${filename} to ${newFilename}`
          : "Renaming file";
      case "delete":
        return filename ? `Deleting ${filename}` : "Deleting file";
      default:
        return "Managing file";
    }
  }

  return tool.toolName;
}

export function ToolInvocationBadge({ tool }: ToolInvocationBadgeProps) {
  const label = getToolLabel(tool);
  const isDone = tool.state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
