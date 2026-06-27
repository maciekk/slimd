import { Editor, Notice, Plugin } from "obsidian";

function isListItem(line: string): boolean {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);
}

function isHorizontalRule(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test(trimmed);
}

function isHeadingLine(line: string): boolean {
  return /^(#{1,6})\s+/.test(line.trim());
}

function removeBlankLinesBetweenListItems(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      let prev = i - 1;
      while (prev >= 0 && lines[prev].trim() === "") prev--;

      let next = i + 1;
      while (next < lines.length && lines[next].trim() === "") next++;

      if (prev >= 0 && next < lines.length) {
        const prevIsList = isListItem(lines[prev]);
        const nextIsList = isListItem(lines[next]);

        if ((prevIsList && nextIsList) || (!prevIsList && nextIsList)) {
          continue;
        }
      }
    }

    out.push(line);
  }

  return out.join("\n");
}

function demoteHeadingsByOne(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(/^(#{1,5})(\s+.*)$/);
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

function removeBlankLinesAfterHorizontalRules(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      let prev = i - 1;
      while (prev >= 0 && lines[prev].trim() === "") prev--;

      let next = i + 1;
      while (next < lines.length && lines[next].trim() === "") next++;

      if (prev >= 0 && next < lines.length) {
        if (isHorizontalRule(lines[prev]) && isHeadingLine(lines[next])) {
          continue;
        }
      }
    }

    out.push(line);
  }

  return out.join("\n");
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

export default class SlimDPlugin extends Plugin {
  async onload(): Promise<void> {
    this.addCommand({
      id: "slimd-tidy-note",
      name: "SliMD: Tidy current note",
      editorCallback: (editor) => {
        applyToEditor(
          editor,
          (text) => {
            let next = removeBlankLinesBetweenListItems(text);
            next = removeBlankLinesAfterHorizontalRules(next);
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
        applyToEditor(editor, removeBlankLinesBetweenListItems, "SliMD list cleanup");
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
