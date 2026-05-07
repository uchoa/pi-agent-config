import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { isToolCallEventType } from "@mariozechner/pi-coding-agent";
import { isSafeCommand } from "./utils.js";

export type Mode = "PLAN" | "BUILD";

export default function (pi: ExtensionAPI) {
    let currentMode: Mode = "PLAN";

    function updateStatus(ctx: ExtensionContext) {
        if (!ctx.hasUI) return;

        // Clear the old footer status in case it was set previously
        ctx.ui.setStatus("mode", undefined);

        if (currentMode === "PLAN") {
            ctx.ui.setWidget("mode-indicator", [ctx.ui.theme.fg("success", "⏸  PLAN MODE")], { placement: "aboveEditor" });
        } else {
            ctx.ui.setWidget("mode-indicator", [ctx.ui.theme.fg("error", "▶ BUILD MODE")], { placement: "aboveEditor" });
        }
    }

    // Load persisted state
    pi.on("session_start", async (_event, ctx) => {
        let savedMode = "PLAN";
        for (const entry of ctx.sessionManager.getBranch()) {
            if (entry.type === "extension" && entry.extensionId === "mode") {
                savedMode = entry.data.mode as Mode;
            }
        }
        currentMode = savedMode as Mode;
        updateStatus(ctx);
    });

    pi.registerCommand("plan", {
        description: "Switch to PLAN MODE (strictly no state changing operations)",
        handler: async (_args, ctx) => {
            currentMode = "PLAN";
            pi.appendEntry("mode", { mode: currentMode });
            updateStatus(ctx);
            ctx.ui.notify("Switched to PLAN MODE. State changing operations are strictly forbidden.", "warning");
            pi.sendUserMessage("I have switched to PLAN MODE. State changing operations are strictly forbidden. You must only read and inspect.", { deliverAs: "followUp" });
        }
    });

    pi.registerCommand("build", {
        description: "Switch to BUILD MODE (state changing operations allowed)",
        handler: async (_args, ctx) => {
            currentMode = "BUILD";
            pi.appendEntry("mode", { mode: currentMode });
            updateStatus(ctx);
            ctx.ui.notify("Switched to BUILD MODE. Full access restored.", "success");
            pi.sendUserMessage("I have switched to BUILD MODE. You now have full access to create, modify files, and run all bash commands.", { deliverAs: "followUp" });
        }
    });

    // Enforce Plan Mode restrictions on tool calls
    pi.on("tool_call", (event, _ctx) => {
        if (currentMode !== "PLAN") {
            return;
        }

        if (isToolCallEventType("edit", event) || isToolCallEventType("write", event)) {
            return {
                block: true,
                reason: "STATE CHANGING OPERATIONS ON LOCAL OR REMOTE RESOURCES ARE STRICTLY FORBIDDEN IN PLAN MODE. Use read instead."
            };
        }

        if (isToolCallEventType("bash", event)) {
            const cmd = event.input.command as string;
            if (cmd && !isSafeCommand(cmd)) {
                return {
                    block: true,
                    reason: `STATE CHANGING BASH COMMANDS ARE STRICTLY FORBIDDEN IN PLAN MODE. Denied command: ${cmd}`
                };
            }
        }
    });

    // Inject strict system prompt instructions dynamically based on mode
    pi.on("before_agent_start", async (event) => {
        const { systemPrompt } = event;
        let modeInstructions = "";
        if (currentMode === "PLAN") {
            modeInstructions = `\n\n[MODE STATUS: PLAN MODE]
**CRITICAL INSTRUCTION: STATE CHANGING OPERATIONS ON LOCAL OR REMOTE RESOURCES ARE STRICTLY FORBIDDEN.**
You are operating in a read-only exploration mode.
- You must NOT use the \`edit\` or \`write\` tools.
- You must NOT attempt to run any destructive bash commands (e.g., rm, mkdir, touch, npm install, git commit).
- You must NOT attempt to run any state-changing CLI commands for remote services (e.g., gh pr merge, gcloud compute instances create, aws ec2 terminate, curl -X POST).
If you attempt to do so, the tool call will be forcefully blocked by the system. Only use tools to read, inspect, and analyze. DO NOT attempt to write or change state.\n\n`;
        } else {
            modeInstructions = `\n\n[MODE STATUS: BUILD MODE]\nYou have full access to create, modify files, and execute bash commands.\n\n`;
        }
        return { systemPrompt: `${systemPrompt}${modeInstructions}` };
    });
}