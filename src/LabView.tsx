import Editor, { type OnMount } from "@monaco-editor/react";
import { Button } from "react-aria-components";
import type { copy } from "./i18n";
import LocaleSwitch from "./LocaleSwitch";
import OutputPanels from "./OutputPanels";
import TutorialPanel from "./TutorialPanel";
import type { Diagnostic, Level, Locale, RunResult } from "./types";
import { levelTitle } from "./uiUtils";

type CollapsedPanels = {
  world: boolean;
  diagnostics: boolean;
  trace: boolean;
};

type LabViewProps = {
  code: string;
  collapsedPanels: CollapsedPanels;
  diagnostics: Diagnostic[];
  isRunning: boolean;
  level: Level;
  locale: Locale;
  modelPath: string;
  runResult: RunResult;
  t: (typeof copy)[Locale];
  onBackToLevels: () => void;
  onChangeCode: (code: string) => void;
  onEditorMount: OnMount;
  onReset: () => void;
  onRun: () => void;
  onSelectLocale: (locale: Locale) => void;
  onTogglePanel: (panel: keyof CollapsedPanels) => void;
};

export default function LabView({
  code,
  collapsedPanels,
  diagnostics,
  isRunning,
  level,
  locale,
  modelPath,
  runResult,
  t,
  onBackToLevels,
  onChangeCode,
  onEditorMount,
  onReset,
  onRun,
  onSelectLocale,
  onTogglePanel,
}: LabViewProps) {
  return (
    <section className="labView">
      <header className="labHeader">
        <div className="labHeaderTitle">
          <Button
            className="react-aria-Button appButton secondary compact"
            onPress={onBackToLevels}
          >
            {t.backToLevels}
          </Button>
          <div>
            <span>{t.currentLevel}</span>
            <strong>{levelTitle(level.name)}</strong>
          </div>
        </div>
        <LocaleSwitch
          label={t.language}
          locale={locale}
          onSelectLocale={onSelectLocale}
        />
      </header>

      <div className="workspace">
        <TutorialPanel level={level} t={t} />

        <div className="editorPane" aria-label={t.typeScriptEditor}>
          <Editor
            height="100%"
            defaultLanguage="typescript"
            path={modelPath}
            theme="vs-dark"
            value={code}
            onChange={(value) => onChangeCode(value ?? "")}
            onMount={onEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              fontLigatures: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        <OutputPanels
          level={level}
          runResult={runResult}
          diagnostics={diagnostics}
          isRunning={isRunning}
          collapsedPanels={collapsedPanels}
          t={t}
          onRun={onRun}
          onReset={onReset}
          onTogglePanel={onTogglePanel}
        />
      </div>
    </section>
  );
}
