# SliMD (Obsidian plugin)

SliMD tidies Markdown notes copied from AI tools or other sources.

## Commands

- **SliMD: Tidy current note**
  - Removes blank lines between list items
  - Removes blank lines immediately before list blocks
  - Removes blank lines between an introductory `:` line and a following blockquote
  - Removes blank lines after horizontal rules
  - Collapses repeated blank lines to a single blank line
  - If the first non-empty line is an `#` heading, preserves it as the title and demotes subsequent headings by 1 level
  - Does not modify fenced code blocks
- **SliMD: Tighten list spacing**
  - Applies the structural blank-line cleanup rules above without heading demotion
- **SliMD: Tighten spacing**
  - Collapses repeated blank lines to a single blank line
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
