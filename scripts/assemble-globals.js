#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const REGISTERS_DIR = path.join(ROOT_DIR, "_registers");
const CONFIGS_DIR = path.join(ROOT_DIR, "_configs");
const OUTPUT_FILE = path.join(CONFIGS_DIR, "globals-assembled.json");

// Helper to read directory of JSON files or single JSON file
function loadJsonDirOrFile(dirPath, fallbackFilePath) {
	let result = {};

	if (fs.existsSync(dirPath)) {
		const stats = fs.statSync(dirPath);
		if (stats.isDirectory()) {
			const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".json"));
			for (const file of files) {
				const filePath = path.join(dirPath, file);
				try {
					const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
					if (files.length === 1 && (file === "navs.json" || file === "configs.json")) {
						result = content;
					} else {
						Object.assign(result, content);
					}
				} catch (err) {
					console.error(`[assemble-globals] Error parsing ${filePath}:`, err.message);
					process.exit(1);
				}
			}
			return result;
		} else if (stats.isFile()) {
			return JSON.parse(fs.readFileSync(dirPath, "utf8"));
		}
	}

	if (fallbackFilePath && fs.existsSync(fallbackFilePath)) {
		return JSON.parse(fs.readFileSync(fallbackFilePath, "utf8"));
	}

	return {};
}

function assembleGlobals() {
	const schemas = {};

	// 1. Read all schema files from _registers/schemas (or _configs/schemas)
	const schemasDir = fs.existsSync(path.join(REGISTERS_DIR, "schemas"))
		? path.join(REGISTERS_DIR, "schemas")
		: path.join(CONFIGS_DIR, "schemas");

	if (fs.existsSync(schemasDir)) {
		const files = fs.readdirSync(schemasDir).filter((file) => file.endsWith(".json"));
		for (const file of files) {
			const key = path.basename(file, ".json");
			const filePath = path.join(schemasDir, file);
			try {
				const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
				schemas[key] = content;
			} catch (err) {
				console.error(`[assemble-globals] Error parsing ${filePath}:`, err.message);
				process.exit(1);
			}
		}
	}

	// 2. Read navs from _registers/navs (or fallback _configs/navs.json)
	const navsDir = path.join(REGISTERS_DIR, "navs");
	const navsFallback = path.join(CONFIGS_DIR, "navs.json");
	const navs = loadJsonDirOrFile(navsDir, navsFallback);

	// 3. Read configs from _registers/configs (or fallback _configs/configs.json)
	const configsDir = path.join(REGISTERS_DIR, "configs");
	const configsFallback = path.join(CONFIGS_DIR, "configs.json");
	const configs = loadJsonDirOrFile(configsDir, configsFallback);

	// 4. Assemble into final object
	const globalsData = {
		schemas,
		navs,
		configs,
	};

	// Ensure output directory exists
	if (!fs.existsSync(CONFIGS_DIR)) {
		fs.mkdirSync(CONFIGS_DIR, { recursive: true });
	}

	// 5. Output assembled globals.json using tab formatting matching original file
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(globalsData, null, "\t") + "\n", "utf8");
	console.log(`[assemble-globals] Successfully built ${OUTPUT_FILE} from ${REGISTERS_DIR}`);
}

if (require.main === module) {
	assembleGlobals();
}

module.exports = { assembleGlobals };
