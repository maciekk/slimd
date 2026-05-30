# SliMD (Obsidian plugin)

SliMD tidies Markdown notes copied from AI tools or other sources.

## Commands

- **SliMD: Tidy current note**
  - Removes blank lines between list items
  - Removes blank lines immediately before list blocks
  - If the first non-empty line is an `#` heading, demotes all headings by 1 level
- **SliMD: Tighten list spacing**
- **SliMD: Demote headings by 1 level**

## Development

```bash
npm install
npm run dev
```

Build once:

```bash
npm run build
```

## Install into an existing vault

Default vault path is `~/Documents/Personal`:

```bash
bash scripts/install.sh
```

Custom vault path:

```bash
bash scripts/install.sh ~/Documents/MyVault
```

This copies:

- `manifest.json`
- `main.js`
- `styles.css`

to:

- `<vault>/.obsidian/plugins/slimd/`
