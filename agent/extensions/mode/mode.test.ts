import { test, expect, vi } from "vitest";
import { isSafeCommand } from "./utils.js";
import modeExtension from "./index.js";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

test("Allows read-only bash commands", () => {
    expect(isSafeCommand("ls -la")).toBe(true);
    expect(isSafeCommand("cat package.json")).toBe(true);
    expect(isSafeCommand("gh pr view")).toBe(true);
    expect(isSafeCommand("gcloud compute instances list")).toBe(true);
});

test("Blocks destructive file operations", () => {
    expect(isSafeCommand("rm -rf node_modules")).toBe(false);
    expect(isSafeCommand("echo 'hack' > file.txt")).toBe(false);
    expect(isSafeCommand("npm install")).toBe(false);
    expect(isSafeCommand("npm rm is-even")).toBe(false);
});

test("Blocks remote state-changing CLI verbs", () => {
    expect(isSafeCommand("gh pr merge")).toBe(false);
    expect(isSafeCommand("gcloud compute instances create my-vm")).toBe(false);
    expect(isSafeCommand("aws ec2 terminate-instances")).toBe(false);
    expect(isSafeCommand("curl -X POST https://api.example.com")).toBe(false);
});

test("Blocks edit and write tools in PLAN mode", async () => {
    const mockPi = {
        on: vi.fn(),
        registerCommand: vi.fn(),
        appendEntry: vi.fn(),
        sendUserMessage: vi.fn(),
    } as unknown as ExtensionAPI;

    // Initialize extension
    modeExtension(mockPi);

    // Extract handlers
    const onCalls = (mockPi.on as any).mock.calls;
    const toolCallHandler = onCalls.find((call: any) => call[0] === "tool_call")[1];
    
    const mockContext = {
        hasUI: true,
        ui: {
            setStatus: vi.fn(),
            notify: vi.fn(),
            setWidget: vi.fn(),
            theme: { fg: vi.fn() }
        }
    } as unknown as ExtensionContext;

    // Simulate edit tool call
    const editEvent = { toolName: "edit", input: { path: "test.txt", edits: [] } };
    const editResult = toolCallHandler(editEvent, mockContext);

    expect(editResult).toEqual({
        block: true,
        reason: expect.stringContaining("STRICTLY FORBIDDEN IN PLAN MODE")
    });
});

test("Allows destructive tools after switching to BUILD mode", async () => {
    const mockPi = {
        on: vi.fn(),
        registerCommand: vi.fn(),
        appendEntry: vi.fn(),
        sendUserMessage: vi.fn(),
    } as unknown as ExtensionAPI;

    modeExtension(mockPi);

    const onCalls = (mockPi.on as any).mock.calls;
    const registerCommandCalls = (mockPi.registerCommand as any).mock.calls;
    
    const toolCallHandler = onCalls.find((call: any) => call[0] === "tool_call")[1];
    const buildCommandHandler = registerCommandCalls.find((call: any) => call[0] === "build")[1].handler;

    const mockContext = {
        hasUI: true,
        ui: {
            setStatus: vi.fn(),
            notify: vi.fn(),
            setWidget: vi.fn(),
            theme: { fg: vi.fn() }
        }
    } as unknown as ExtensionContext;

    // Switch to BUILD mode
    await buildCommandHandler({}, mockContext);

    // Simulate write tool call
    const writeEvent = { toolName: "write", input: { path: "test.txt", content: "data" } };
    const result = toolCallHandler(writeEvent, mockContext);

    // Should be allowed (returns undefined or nothing)
    expect(result).toBeUndefined();
});
