import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import type { ExtensionRuntime } from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import { Container, SelectList, Text } from "@mariozechner/pi-tui";
import type { SelectItem } from "@mariozechner/pi-tui";

const execAsync = promisify(exec);

interface GcloudConfig {
  name: string;
  isActive: boolean;
  project?: string;
  region?: string;
  account?: string;
}

function getGcloudConfigs(): GcloudConfig[] {
  const configs: GcloudConfig[] = [];
  const gcloudConfigDir = process.env.CLOUDSDK_CONFIG || (process.platform === 'win32' && process.env.APPDATA ? join(process.env.APPDATA, "gcloud") : join(homedir(), ".config", "gcloud"));
  const activeConfigFile = join(gcloudConfigDir, "active_config");
  const configurationsDir = join(gcloudConfigDir, "configurations");

  let activeConfigName = "";
  if (existsSync(activeConfigFile)) {
    activeConfigName = readFileSync(activeConfigFile, "utf8").trim();
  }

  if (existsSync(configurationsDir)) {
    const files = readdirSync(configurationsDir);
    for (const file of files) {
      if (file.startsWith("config_")) {
        const name = file.replace("config_", "");
        const configPath = join(configurationsDir, file);
        const configContent = readFileSync(configPath, "utf8");
        
        let currentSection = "";
        let project: string | undefined;
        let region: string | undefined;
        let account: string | undefined;

        for (let line of configContent.split("\n")) {
          line = line.trim();
          if (line.startsWith("[") && line.endsWith("]")) {
            currentSection = line.slice(1, -1);
          } else if (line.includes("=")) {
            const parts = line.split("=");
            const key = parts[0];
            const value = parts.slice(1).join("=").trim();
            const k = key.trim();
            
            if (currentSection === "core" && k === "project") project = value;
            if (currentSection === "core" && k === "account") account = value;
            if (currentSection === "compute" && k === "region") region = value;
            if (currentSection === "artifacts" && k === "location" && !region) region = value;
          }
        }

        configs.push({
          name,
          isActive: name === activeConfigName,
          project,
          region,
          account
        });
      }
    }
  }

  return configs;
}

let topProject: string | undefined;
let topRegion: string | undefined;

try {
  const configs = getGcloudConfigs();
  const activeConfig = configs.find(c => c.isActive);
  
  if (activeConfig) {
    topProject = activeConfig.project;
    topRegion = activeConfig.region;
  }

  // Fallback to calling gcloud executable if config files aren't found or missing fields
  if (!topProject) {
    try {
      const p = execSync("gcloud config get-value project 2>/dev/null", { encoding: "utf8" }).trim();
      if (p && p !== "(unset)") topProject = p;
    } catch (e) {}
  }
  
  if (!topRegion) {
    try {
      const r = execSync("gcloud config get-value compute/region 2>/dev/null", { encoding: "utf8" }).trim();
      if (r && r !== "(unset)") topRegion = r;
    } catch (e) {}
  }
} catch (e) {}

const resolvedProject = process.env.GOOGLE_CLOUD_PROJECT || topProject;
if (!resolvedProject) {
  throw new Error("GOOGLE_CLOUD_PROJECT is not set and could not be determined from gcloud configuration.");
}

process.env.GOOGLE_CLOUD_PROJECT = resolvedProject;
process.env.GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || topRegion || "global";

export default function (pi: ExtensionRuntime) {
  pi.registerCommand("gcloud:activate", {
    description: "Select and activate a gcloud configuration",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("UI is required to activate gcloud config", "error");
        return;
      }

      let configs: GcloudConfig[] = [];
      try {
        configs = getGcloudConfigs();
      } catch (e) {}

      if (configs.length === 0) {
        ctx.ui.notify("No gcloud configurations found.", "info");
        return;
      }

      const activeConfig = configs.find(c => c.isActive);

      const items: SelectItem[] = configs.map(c => {
        const descLines = [];
        if (c.account) descLines.push(`Account: ${c.account}`);
        if (c.project) descLines.push(`Project: ${c.project}`);
        if (c.region) descLines.push(`Region/Location: ${c.region}`);
        
        return {
          value: c.name,
          label: `${c.name}${c.isActive ? " [Active]" : ""}`,
          description: descLines.join(" | ") || "No details available"
        };
      });

      const selectedName = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
        const container = new Container();

        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
        container.addChild(new Text(theme.fg("accent", theme.bold("Select gcloud configuration")), 1, 0));

        const selectList = new SelectList(items, Math.min(items.length, 10), {
          selectedPrefix: (t) => theme.fg("accent", t),
          selectedText: (t) => theme.fg("accent", t),
          description: (t) => theme.fg("muted", t),
          scrollInfo: (t) => theme.fg("dim", t),
          noMatch: (t) => theme.fg("warning", t),
        });

        selectList.onSelect = (item) => done(item.value);
        selectList.onCancel = () => done(null);
        
        container.addChild(selectList);
        container.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 1, 0));
        container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

        return {
          render: (w) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data) => {
            selectList.handleInput(data);
            tui.requestRender();
          }
        };
      });

      if (selectedName && (!activeConfig || selectedName !== activeConfig.name)) {
        ctx.ui.setStatus("gcloud", `Activating ${selectedName}...`);
        try {
          // Activate selected config
          await execAsync(`gcloud config configurations activate ${selectedName}`);
          
          // Load project and region/location using gcloud
          try {
            const { stdout: pOut } = await execAsync("gcloud config get-value project 2>/dev/null");
            const project = pOut.trim();
            if (project && project !== "(unset)") process.env.GOOGLE_CLOUD_PROJECT = project;
          } catch(e) {}
          
          try {
            const { stdout: rOut } = await execAsync("gcloud config get-value compute/region 2>/dev/null");
            let region = rOut.trim();
            if (!region || region === "(unset)") {
              try {
                const { stdout: locOut } = await execAsync("gcloud config get-value artifacts/location 2>/dev/null");
                region = locOut.trim();
              } catch(e) {}
            }
            if (region && region !== "(unset)") process.env.GOOGLE_CLOUD_LOCATION = region;
          } catch(e) {}
          
          ctx.ui.notify(`Activated gcloud configuration: ${selectedName}`, "success");
        } catch (err) {
          ctx.ui.notify(`Failed to activate ${selectedName}`, "error");
        } finally {
          ctx.ui.setStatus("gcloud", undefined);
        }
      }
    }
  });
}
