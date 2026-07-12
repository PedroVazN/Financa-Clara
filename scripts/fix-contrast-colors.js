const fs = require("fs");
const path = require("path");

const reps = [
  [/text-slate-900/g, "text-foreground"],
  [/text-slate-800/g, "text-foreground"],
  [/text-slate-700/g, "text-foreground"],
  [/text-slate-600/g, "text-muted-foreground"],
  [/text-slate-500/g, "text-muted-foreground"],
  [/text-slate-400/g, "text-muted-foreground"],
  [/bg-slate-50\/80/g, "bg-muted/80"],
  [/bg-slate-50\/70/g, "bg-muted/70"],
  [/bg-slate-50/g, "bg-muted"],
  [/bg-slate-100/g, "bg-muted"],
  [/bg-slate-200/g, "bg-muted"],
  [/border-slate-200/g, "border-border"],
  [/border-slate-300/g, "border-border"],
  [/text-teal-800/g, "text-primary"],
  [/text-teal-700/g, "text-primary"],
  [/text-teal-950/g, "text-foreground"],
  [/bg-teal-50\/50/g, "bg-accent/50"],
  [/bg-teal-50/g, "bg-accent"],
  [/bg-teal-600/g, "bg-primary"],
  [/bg-teal-700/g, "bg-primary"],
  [/hover:bg-teal-50\/50/g, "hover:bg-accent"],
  [/hover:bg-teal-50/g, "hover:bg-accent"],
  [/hover:bg-slate-100/g, "hover:bg-muted"],
  [/bg-white\/85/g, "bg-card"],
  [/bg-white\/80/g, "bg-card"],
  [/bg-white\/70/g, "bg-card"],
  [/bg-white\/50/g, "bg-card"],
  [/bg-white/g, "bg-card"],
  [/text-ink/g, "text-foreground"],
  [/from-teal-600 to-emerald-500/g, "from-primary to-leaf"],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "ui"].includes(entry.name)) continue;
      walk(full);
      continue;
    }
    if (!/\.(tsx|ts)$/.test(entry.name)) continue;
    let content = fs.readFileSync(full, "utf8");
    const original = content;
    for (const [pattern, replacement] of reps) {
      content = content.replace(pattern, replacement);
    }
    if (content !== original) {
      fs.writeFileSync(full, content);
      console.log("updated", full);
    }
  }
}

walk(path.join(process.cwd(), "src"));
