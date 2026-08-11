# Ketrik Web Assets & Public Data

This repository contains public web assets, global configurations, content schemas, and static documentation hosted for [ketrik.com](https://ketrik.com).

## Repository Overview

`ketrik-web` serves as the public repository for the Ketrik web application (`ketrik.com`). It stores static resources, public documentation, UI assets, and configuration schemas specifically used by the Ketrik web.

## Directory Structure

- **`_assets/`**: Public images, icons, branding elements, and vector diagrams used across ketrik.com.
- **`_configs/`**: Global configuration files (`globals.json`, `metadata.json`, etc.) defining application constants and feature setups.
- **`_docs/`**: Markdown source documentation, articles, legal policies (Privacy, Terms), and product pages.
- **`_registers/`**: JSON schema definitions, navigation registries, page component schemas, and notification specs.
- **`scripts/`**: Build and assembly scripts (e.g., `assemble-globals.js`) for bundling global configs and registers.
- **`robots.txt`**: Standard search engine crawler directives for public site hosting.

## Building & Utilities

To assemble the global configuration files:

```bash
node scripts/assemble-globals.js
```

---

_© Ketrik. All rights reserved._
