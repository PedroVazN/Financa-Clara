const fs = require("fs");
const path = require("path");

const reps = [
  [/text-teal-900/g, "text-foreground"],
  [/border-teal-200/g, "border-border"],
  [/border-teal-100/g, "border-border"],
  [/hover:border-teal-200/g, "hover:border-primary/40"],
  [/divide-slate-100/g, "divide-border"],
  [/from-teal-700 to-emerald-500/g, "from-primary to-leaf"],
  [/bg-amber-100 px-2\.5 py-1 text-xs font-semibold text-amber-900/g, "bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-200"],
  [/bg-amber-100 px-2 py-0\.5 text-xs font-semibold text-amber-900/g, "bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-200"],
  [/text-canopy/g, "text-primary"],
  [/bg-canopy/g, "bg-primary"],
  [/bg-mist/g, "bg-secondary"],
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
