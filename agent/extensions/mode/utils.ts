export const DESTRUCTIVE_PATTERNS = [
    // Standard File & System Operations
    /\brm\b/i, /\brmdir\b/i, /\bmv\b/i, /\bcp\b/i, /\bmkdir\b/i, /\btouch\b/i,
    /\bchmod\b/i, /\bchown\b/i, /\bchgrp\b/i, /\bln\b/i, /\btee\b/i, /\btruncate\b/i,
    /\bdd\b/i, /\bshred\b/i, /(^|[^<])>(?!>)/, />>/, 
    
    // Package Managers
    /\bnpm\s+(install|uninstall|update|ci|link|publish|rm)/i,
    /\byarn\s+(add|remove|install|publish|rm)/i,
    /\bpnpm\s+(add|remove|install|publish|rm)/i,
    /\bpip\s+(install|uninstall)/i,
    /\bapt(-get)?\s+(install|remove|purge|update|upgrade)/i,
    /\bbrew\s+(install|uninstall|upgrade)/i,
    
    // Git Operations
    /\bgit\s+(add|commit|push|pull|merge|rebase|reset|checkout|branch\s+-[dD]|stash|cherry-pick|revert|tag|init|clone)/i,
    
    // System Control
    /\bsudo\b/i, /\bsu\b/i, /\bkill\b/i, /\bpkill\b/i, /\bkillall\b/i,
    /\breboot\b/i, /\bshutdown\b/i, /\bsystemctl\s+(start|stop|restart|enable|disable)/i,
    /\bservice\s+\S+\s+(start|stop|restart)/i,
    
    // Editors
    /\b(vim?|nano|emacs|code|subl)\b/i,
    
    // HTTP/API Write requests
    /\bcurl.*-X\s*(POST|PUT|DELETE|PATCH)/i,
    /\bwget.*--method=(POST|PUT|DELETE|PATCH)/i,

    // GitHub CLI (gh) - Block state-changing verbs
    /\bgh\s+.*\b(create|edit|close|delete|merge|review|login|push|deploy|run|cancel)\b/i,
    /\bgh\s+api.*-X\s*(POST|PUT|DELETE|PATCH)/i,

    // Google Cloud CLI (gcloud) - Block state-changing verbs
    /\bgcloud\s+.*\b(create|delete|update|set|deploy|run|stop|start|restart|init|auth)\b/i,

    // AWS CLI (aws) - Block state-changing verbs
    /\baws\s+.*\b(create|delete|update|put|post|terminate|start|stop|deploy|attach|detach)\b/i,

    // Kubernetes CLI (kubectl) - Block state-changing verbs
    /\bkubectl\s+(apply|delete|create|edit|scale|rollout|patch|replace|cordon|drain|auth)\b/i,

    // Terraform/OpenTofu
    /\b(terraform|tofu)\s+(apply|destroy|import|init|force-unlock|workspace\s+(new|delete))\b/i
];

export function isSafeCommand(cmd: string): boolean {
    return !DESTRUCTIVE_PATTERNS.some(pattern => pattern.test(cmd));
}
