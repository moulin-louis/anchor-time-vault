// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

const anchor = require("@coral-xyz/anchor");
import { copyFileSync } from "node:fs";

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
  console.log("Running migrations...:");
  copyFileSync("./target/types/time_vault_lock.ts", "./app/src/idl/idl.ts");
  console.log("-  idl.ts copied");

  copyFileSync("./target/idl/time_vault_lock.json", "./app/src/idl/idl.json");
  console.log("- idl.json copied");
  console.log("✅ Migration done!");
};
