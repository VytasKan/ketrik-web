---
name: "Edit Ketrik Globals"
description: "Instructions and rules on how to edit and format the globals.json config file for Ketrik UI components."
---

# Guidelines for Editing globals.json

Provide details here on how the configs map, color schemes to use, and any custom validation constraints.

## Config Mappings and Structure

The `globals.json` file configures the Ketrik landing page and marketing sections. It is structured under a root key (typically `"$root$"`), which defines:
1. `data`: The content configurations for each section (e.g. `hero`, `subHero`, `advantage`, `vibe`, `stories`, `panel1`, `panel2`, `panel3`).
2. `config`: The layout configurations, detailing `disableGutter`, `groups`, `itemSize`, `cardConfig` mappings, and display toggles.

### Section Mappings under `data`

- **`hero`**:
  - `background`: Sets custom backgrounds.
    - `style`: Maps `--bg-image` and `--bg-image-dark` CSS variables.
  - `button`: Button target (`href`) and display text (`text`).
  - `subtitle`: Standard text array with configurable font variants (`vx`).
  - `title`: Contains title blocks and typewriter elements.
    - `variant: "typewriter"`: Renders typewriter animation using `phrases` (array of strings), `intensity`, and `pauseTime`.

- **`subHero`**:
  - Contains features grids under `featuresGrid.ds` with `title`, `icon` (standard Material icon name or similar), and `description`.

- **`advantage`**:
  - Contains `comparisonTable` data under `ds` (for columns: feature, traditional, vibe, approach) and `ds1` (for columns: feature, traditional, vibe, modular).
  - Also defines custom section titles and subtitles like `title1` and `subtitle1`.

- **`vibe`**:
  - Custom grid pattern styles under `backgroun.style` using repeating linear gradients and radial gradients.

- **`panel1` & `panel2`**:
  - Structured features grid with sequential icons, step titles, and step descriptions (e.g., Venture Intake, Deep-Dive Session, etc.).

## Button Color Mappings

- For primary branding buttons, use: `primary`
- For warning/attention buttons, use: `warning`
- For destructive or red actions, use: `danger` (mapped to red in NextUI)

## Verification

- Before committing, ensure the JSON is valid. Use a JSON validator or parser to check syntax.
