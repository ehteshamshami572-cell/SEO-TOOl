const fs = require("node:fs");
const path = require("node:path");

let targetProvider = process.argv[2];

if (!targetProvider) {
  let dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    try {
      const envPath = path.join(__dirname, "..", ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
        if (match) dbUrl = match[1];
      }
    } catch {}
  }
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    targetProvider = "postgresql";
  } else if (dbUrl.startsWith("file:")) {
    targetProvider = "sqlite";
  } else if (process.env.NETLIFY) {
    // Default to postgresql on Netlify deployments
    targetProvider = "postgresql";
  } else {
    targetProvider = "sqlite";
  }
}

if (!["postgresql", "sqlite"].includes(targetProvider)) {
  console.error("Invalid provider. Usage: node switch-db.js [postgresql|sqlite]");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let content = fs.readFileSync(schemaPath, "utf-8");

content = content.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${targetProvider}"`
);

fs.writeFileSync(schemaPath, content, "utf-8");
console.log(`[ShopifySEO] Prisma schema provider set to: ${targetProvider}`);
