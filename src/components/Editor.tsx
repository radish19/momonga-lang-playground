import { MutableRefObject, memo, useEffect, useRef, useState } from "react";

import { Box } from "@mui/material";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import { snippets } from "@/constants";
import { useIsDarkMode } from "@/hooks/useIsDarkMode";
import { MonacoTheme, SnippetKey } from "@/types/types";

monaco.languages.register({ id: "momonga" });
monaco.languages.setLanguageConfiguration("momonga", {
  comments: {
    lineComment: "//",
    blockComment: ["/*", "*/"],
  },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "'", close: "'" },
    { open: '"', close: '"' },
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "'", close: "'", notIn: ["string", "comment"] },
    { open: '"', close: '"', notIn: ["string", "comment"] },
  ],
  indentationRules: {
    increaseIndentPattern: new RegExp(
      "^((?!\\/\\/).)*(\\{[^}\"'`]*|\\([^)\"'`]*|\\[[^\\]\"'`]*)$",
    ),
    decreaseIndentPattern: new RegExp("^((?!.*?\\/\\*).*\\*/)?\\s*[\\}\\]].*$"),
  },
});
monaco.languages.setMonarchTokensProvider("momonga", {
  keywords: [
    "break",
    "continue",
    "else",
    "false",
    "for",
    "func",
    "if",
    "return",
    "true",
    "var",
  ],
  tokenizer: {
    root: [
      [
        /@?[a-zA-Z][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "variable",
          },
        },
      ],
      [/\/\/.*/m, "comment"], // TODO: Add block comment regexp
      [/".*?"/, "string"],
    ],
  },
});
monaco.editor.defineTheme("monaco-theme-light", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "#0000FF" },
    { token: "variable", foreground: "#001080" },
    { token: "comment", foreground: "#008000" },
    { token: "string", foreground: "#A31515" },
  ],
  colors: {
    "editor.background": "#FFFFFF",
  },
});

monaco.editor.defineTheme("monaco-theme-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "keyword", foreground: "#C586C0" },
    { token: "variable", foreground: "#9CDCFE" },
    { token: "comment", foreground: "#6A9955" },
    { token: "string", foreground: "#CE9178" },
  ],
  colors: {
    "editor.background": "#1E1E1E",
  },
});

type Props = {
  isParseError: boolean;
  srcRef: MutableRefObject<string>;
  snippetKey: SnippetKey;
  onSrcChange: (src: string) => void;
};

export const Editor = memo(
  ({ isParseError, srcRef, snippetKey, onSrcChange }: Props) => {
    const [editor, setEditor] =
      useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoEl = useRef<HTMLElement>(null);

    const isDarkMode = useIsDarkMode();

    const monacoTheme: MonacoTheme = isDarkMode
      ? "monaco-theme-dark"
      : "monaco-theme-light";

    useEffect(
      () => {
        const editor = monaco.editor.create(monacoEl.current!, {
          value: srcRef.current,
          language: "momonga",
          theme: monacoTheme,
          autoIndent: "brackets",
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          bracketPairColorization: {
            enabled: true,
            independentColorPoolPerBracketType: true,
          },
          minimap: { enabled: false },
          lineNumbers: "on",
          automaticLayout: true,
          fontSize: 16,
        });

        editor.onDidChangeModelContent(() => {
          onSrcChange(editor.getValue());
        });

        setEditor(editor);

        return () => editor.dispose();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    useEffect(() => {
      if (editor) {
        editor.setValue(snippets.find((s) => s.key === snippetKey)?.code || "");
      }
    }, [editor, snippetKey]);

    useEffect(() => {
      if (editor) {
        monaco.editor.setTheme(monacoTheme);
      }
    }, [editor, monacoTheme]);

    return (
      <Box
        ref={monacoEl}
        sx={{
          height: "100%",
          border: isParseError ? "2px solid #FF0000" : "2px solid transparent",
        }}
      ></Box>
    );
  },
);
