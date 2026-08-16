import { Editor, Notice, Plugin } from "obsidian";

function isListItem(line: string): boolean {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
}

function isHorizontalRule(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test(trimmed);
}

function isBlockquoteLine(line: string): boolean {
  return /^\s*>/.test(line);
}

function isFenceLine(line: string): boolean {
  return /^\s*(```|~~~)/.test(line);
}

function endsWithIntroPunctuation(line: string): boolean {
  return /[:：]\s*$/.test(line.trim());
}

function getProtectedLineMask(lines: string[]): boolean[] {
  const mask: boolean[] = [];
  let inFence = false;

  for (const line of lines) {
    if (isFenceLine(line)) {
      mask.push(true);
      inFence = !inFence;
      continue;
    }

    mask.push(inFence);
  }

  return mask;
}

function removeBlankLinesAroundStructuredBlocks(text: string): string {
  const lines = text.split("\n");
  const protectedMask = getProtectedLineMask(lines);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (protectedMask[i] || line.trim() !== "") {
      out.push(line);
      continue;
    }

    let prev = i - 1;
    while (prev >= 0 && lines[prev].trim() === "") prev--;

    let next = i + 1;
    while (next < lines.length && lines[next].trim() === "") next++;

    if (
      prev >= 0 &&
      next < lines.length &&
      !protectedMask[prev] &&
      !protectedMask[next]
    ) {
      const prevLine = lines[prev];
      const nextLine = lines[next];
      const prevIsList = isListItem(prevLine);
      const nextIsList = isListItem(nextLine);
      const nextIsBlockquote = isBlockquoteLine(nextLine);

      if ((prevIsList && nextIsList) || (!prevIsList && nextIsList)) {
        continue;
      }

      if (endsWithIntroPunctuation(prevLine) && nextIsBlockquote) {
        continue;
      }

      if (isHorizontalRule(prevLine)) {
        continue;
      }
    }

    out.push(line);
  }

  return out.join("\n");
}

function collapseConsecutiveBlankLines(text: string): string {
  const lines = text.split("\n");
  const protectedMask = getProtectedLineMask(lines);
  const out: string[] = [];
  let previousWasBlank = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (protectedMask[i]) {
      out.push(line);
      previousWasBlank = false;
      continue;
    }

    const isBlank = line.trim() === "";
    if (isBlank && previousWasBlank) {
      continue;
    }

    out.push(line);
    previousWasBlank = isBlank;
  }

  return out.join("\n");
}

function demoteHeadingsByOne(text: string): string {
  const lines = text.split("\n");
  let firstContentSeen = false;
  let preservedTitle = false;

  return lines
    .map((line) => {
      const trimmed = line.trim();

      if (trimmed === "" || isHorizontalRule(trimmed)) {
        return line;
      }

      const m = line.match(/^(#{1,5})(\s+.*)$/);

      if (!firstContentSeen) {
        firstContentSeen = true;
        if (m && m[1].length === 1) {
          preservedTitle = true;
          return line;
        }
      }

      if (!m) return line;
      return `#${m[1]}${m[2]}`;
    })
    .join("\n");
}

function shouldAutoDemoteHeadings(text: string): boolean {
  const lines = text.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "" || isHorizontalRule(line)) continue;

    const m = line.match(/^(#{1,6})\s+/);
    if (!m) return false;

    return m[1].length === 1;
  }

  return false;
}

function applyToEditor(
  editor: Editor,
  transform: (text: string) => string,
  successLabel: string
): void {
  const original = editor.getValue();
  const updated = transform(original);

  if (updated === original) {
    new Notice(`${successLabel}: no changes needed`);
    return;
  }

  const cursor = editor.getCursor();
  const scroll = editor.getScrollInfo();

  editor.setValue(updated);
  editor.setCursor(cursor);
  editor.scrollTo(scroll.left, scroll.top);

  new Notice(`${successLabel}: cleaned up`);
}

function applyToSelection(
  editor: Editor,
  transform: (text: string) => string,
  successLabel: string
): void {
  const original = editor.getSelection();

  if (original.length === 0) {
    new Notice(`${successLabel}: no selection`);
    return;
  }

  const updated = transform(original);

  if (updated === original) {
    new Notice(`${successLabel}: no changes needed`);
    return;
  }

  const scroll = editor.getScrollInfo();

  editor.replaceSelection(updated);
  editor.scrollTo(scroll.left, scroll.top);

  new Notice(`${successLabel}: cleaned up`);
}

export default class SlimDPlugin extends Plugin {
  async onload(): Promise<void> {
    this.addCommand({
      id: "slimd-tidy-note",
      name: "SliMD: Tidy current note",
      editorCallback: (editor) => {
        applyToEditor(
          editor,
          (text) => {
            let next = removeBlankLinesAroundStructuredBlocks(text);
            next = collapseConsecutiveBlankLines(next);
            if (shouldAutoDemoteHeadings(next)) {
              next = demoteHeadingsByOne(next);
            }
            return next;
          },
          "SliMD"
        );
      }
    });

    this.addCommand({
      id: "slimd-tighten-lists",
      name: "SliMD: Tighten list spacing",
      editorCallback: (editor) => {
        applyToEditor(editor, removeBlankLinesAroundStructuredBlocks, "SliMD list cleanup");
      }
    });

    this.addCommand({
      id: "slimd-tighten-spacing",
      name: "SliMD: Tighten spacing",
      editorCallback: (editor) => {
        applyToEditor(editor, collapseConsecutiveBlankLines, "SliMD spacing cleanup");
      }
    });

    this.addCommand({
      id: "slimd-tidy-selection",
      name: "SliMD: Tidy selection",
      editorCallback: (editor) => {
        applyToSelection(
          editor,
          (text) => {
            let next = removeBlankLinesAroundStructuredBlocks(text);
            next = collapseConsecutiveBlankLines(next);
            if (shouldAutoDemoteHeadings(next)) {
              next = demoteHeadingsByOne(next);
            }
            return next;
          },
          "SliMD"
        );
      }
    });

    this.addCommand({
      id: "slimd-demote-headings",
      name: "SliMD: Demote headings by 1 level",
      editorCallback: (editor) => {
        applyToEditor(editor, demoteHeadingsByOne, "SliMD heading demotion");
      }
    });
  }
}
