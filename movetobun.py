from pathlib import Path
from sys import exit
from subprocess import run

def replace(files: str, search: str, replace: str):
    failed = True
    patterns = files.split(' ')
    while len(patterns) > 0:
        pattern = patterns.pop()
        for file in Path('.').rglob(pattern):
            file.write_text(file.read_text().replace(search, replace))
            print(f"Replaced '{search}' with '{replace}' in {file}")
            failed = False

    if failed:
        print(f"Could not find any '{search}' in any {files} file")
        exit(1)

def remove(files: str):
    for file in Path('.').rglob(files):
        file.unlink()

# Github actions

workflows = ".github/workflows/*.yml"

replace(workflows, "Install Node.js", "Setup Bun")
replace(workflows, "node-version-file: package.json", "bun-version-file: .bun-version")
replace(workflows, "uses: actions/setup-node@v5", "uses: oven-sh/setup-bun@v2")
replace(workflows, "cache: npm", "")

# npm run / npm ci / npm i / npx calls

targets = f"package.json {workflows}"

replace(targets, "npm run", "bun run")
replace(targets, "npm pack", "bun pm pack")
replace(targets, "npm add", "bun add")
replace(targets, "npm test", "bun run test")
replace(targets, "npm ci", "bun install --frozen-lockfile")
replace(targets, "npm install", "bun install")
replace(targets, "npm i", "bun install")
replace(targets, "npx", "bunx")
replace(targets, "node -e", "bun -e")
replace(targets, "require('fs')", "require('node:fs')")
replace(targets, 'require("fs")', 'require("node:fs")')
replace(targets, "require('child_process')", "require('node:child_process')")
replace(targets, 'require("child_process")', 'require("node:child_process")')


# lockfile

# remove("package-lock.json")
# run("bun install", shell=True)
