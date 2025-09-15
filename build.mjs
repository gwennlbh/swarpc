#!/usr/bin/env bun
import { $ } from "bun";
import { readdirSync, statSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Check if watch mode is requested
const watchMode = process.argv.includes('--watch');

// Get all TypeScript files in src/
const srcDir = "./src";
const outDir = "./dist";

function getTypeScriptFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isFile() && entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function buildAll() {
  const tsFiles = getTypeScriptFiles(srcDir);

  // Ensure dist directory exists
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log("🚀 Building with Bun compiler...");

  // Transpile each TypeScript file to JavaScript using Bun
  for (const file of tsFiles) {
    const filename = file.replace(/^src\//, '').replace(/\.ts$/, '.js');
    const outputFile = `${outDir}/${filename}`;
    
    console.log(`📦 ${file} → ${outputFile}`);
    
    await $`bun build ${file} --no-bundle --target=node --outfile=${outputFile}`;
  }

  console.log("📝 Generating TypeScript declarations...");

  // Generate TypeScript declarations using tsc in emitDeclarationOnly mode
  await $`bunx tsc --emitDeclarationOnly`;

  console.log("✅ Build complete!");
}

if (watchMode) {
  console.log("👁️ Watch mode enabled - building on changes...");
  
  // Initial build
  await buildAll();
  
  // Use Bun's built-in file watcher 
  const watcher = require("fs").watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`🔄 File changed: ${filename}`);
      await buildAll();
    }
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Stopping watch mode...');
    watcher.close();
    process.exit(0);
  });

  // Keep the process alive
  await new Promise(() => {});
} else {
  await buildAll();
}