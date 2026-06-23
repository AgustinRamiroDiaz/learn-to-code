import { type Monaco, type OnMount } from "@monaco-editor/react";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { I18nProvider } from "react-aria-components";
import type { editor, Uri } from "monaco-editor";
import { gameApiTypes, getLevels } from "./level";
import { copy, localeTags } from "./i18n";
import LabView from "./LabView";
import LevelSelectView from "./LevelSelectView";
import type { Diagnostic, Level, Locale, RunResult } from "./types";

const modelPath = "file:///solution.ts";
const runTimeoutMs = 1000;
const savedCodeStorageKey = "typescript-minigame-lab:level-code";

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = copy[locale];
  const levels = getLevels(locale);
  const [savedCodeByLevel, setSavedCodeByLevel] =
    useState<Record<string, string>>(readSavedCode);
  const [activeLevelId, setActiveLevelId] = useState(levels[0].id);
  const activeLevel =
    levels.find((level) => level.id === activeLevelId) ?? levels[0];
  const idleResult: RunResult = {
    status: "idle",
    message: t.messages.idle,
    trace: [],
  };
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [code, setCode] = useState(
    savedCodeByLevel[activeLevel.id] ?? activeLevel.starterCode,
  );
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [runResult, setRunResult] = useState<RunResult>(idleResult);
  const [isRunning, setIsRunning] = useState(false);
  const [view, setView] = useState<"levels" | "lab">("levels");
  const [collapsedPanels, setCollapsedPanels] = useState({
    world: false,
    diagnostics: false,
    trace: false,
  });

  useEffect(() => {
    document.documentElement.lang = localeTags[locale];
  }, [locale]);

  const handleEditorMount: OnMount = (editorInstance, monacoInstance) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.ES2020,
      module: monacoInstance.languages.typescript.ModuleKind.None,
      strict: true,
      noImplicitAny: true,
      noEmitOnError: false,
      allowNonTsExtensions: true,
    });

    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
      {
        noSemanticValidation: false,
        noSyntaxValidation: false,
      },
    );

    monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
      gameApiTypes,
      "file:///game-api.d.ts",
    );
  };

  const reset = () => {
    const nextSavedCode = { ...savedCodeByLevel };
    delete nextSavedCode[activeLevel.id];

    setSavedCodeByLevel(nextSavedCode);
    writeSavedCode(nextSavedCode);
    setCode(activeLevel.starterCode);
    setDiagnostics([]);
    setRunResult(idleResult);
    editorRef.current?.setValue(activeLevel.starterCode);
  };

  const selectLevel = (level: Level) => {
    const nextCode = savedCodeByLevel[level.id] ?? level.starterCode;

    setActiveLevelId(level.id);
    setCode(nextCode);
    setDiagnostics([]);
    setRunResult(idleResult);
    editorRef.current?.setValue(nextCode);
    setView("lab");
  };

  const updateCode = (nextCode: string) => {
    const nextSavedCode = {
      ...savedCodeByLevel,
      [activeLevel.id]: nextCode,
    };

    setCode(nextCode);
    setSavedCodeByLevel(nextSavedCode);
    writeSavedCode(nextSavedCode);
  };

  const selectLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setDiagnostics([]);
    setRunResult({
      status: "idle",
      message: copy[nextLocale].messages.idle,
      trace: [],
    });
  };

  const run = async () => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();

    if (!monaco || !model) {
      return;
    }

    setIsRunning(true);
    setRunResult({
      status: "running",
      message: t.messages.checking,
      trace: [],
    });

    try {
      const foundDiagnostics = await collectDiagnostics(monaco, model.uri);
      setDiagnostics(foundDiagnostics);

      const hasErrors = foundDiagnostics.some(
        (item) => item.severity === "error",
      );
      if (hasErrors) {
        setRunResult({
          status: "failed",
          message: t.messages.fixTypes,
          trace: [],
        });
        return;
      }

      const js = await emitJavaScript(monaco, model.uri);
      const result = await runInWorker(
        js,
        activeLevel,
        locale,
        workerRef,
        t.messages.timeout,
      );
      setRunResult(result);
    } catch (error) {
      setRunResult({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : t.messages.cannotRun,
        trace: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const togglePanel = (panel: keyof typeof collapsedPanels) => {
    setCollapsedPanels((current) => ({
      ...current,
      [panel]: !current[panel],
    }));
  };

  return (
    <I18nProvider locale={localeTags[locale]}>
      <main className="appShell">
        {view === "levels" ? (
          <LevelSelectView
            levels={levels}
            locale={locale}
            t={t}
            onSelectLevel={selectLevel}
            onSelectLocale={selectLocale}
          />
        ) : (
          <LabView
            code={code}
            collapsedPanels={collapsedPanels}
            diagnostics={diagnostics}
            isRunning={isRunning}
            level={activeLevel}
            locale={locale}
            modelPath={modelPath}
            runResult={runResult}
            t={t}
            onBackToLevels={() => setView("levels")}
            onChangeCode={updateCode}
            onEditorMount={handleEditorMount}
            onReset={reset}
            onRun={run}
            onSelectLocale={selectLocale}
            onTogglePanel={togglePanel}
          />
        )}
      </main>
    </I18nProvider>
  );
}

async function collectDiagnostics(
  monaco: Monaco,
  uri: Uri,
): Promise<Diagnostic[]> {
  const worker = await monaco.languages.typescript.getTypeScriptWorker();
  const client = await worker(uri);
  const [syntactic, semantic] = await Promise.all([
    client.getSyntacticDiagnostics(uri.toString()),
    client.getSemanticDiagnostics(uri.toString()),
  ]);
  const model = monaco.editor.getModel(uri);

  return [...syntactic, ...semantic].map((item) => {
    const start = typeof item.start === "number" ? item.start : 0;
    const position = model?.getPositionAt(start) ?? {
      lineNumber: 1,
      column: 1,
    };

    return {
      message: flattenDiagnosticMessage(item.messageText),
      line: position.lineNumber,
      column: position.column,
      severity:
        item.category === 1
          ? "error"
          : item.category === 0
            ? "warning"
            : "info",
    };
  });
}

async function emitJavaScript(monaco: Monaco, uri: Uri): Promise<string> {
  const worker = await monaco.languages.typescript.getTypeScriptWorker();
  const client = await worker(uri);
  const output = await client.getEmitOutput(uri.toString());
  const file = output.outputFiles.find((item) => item.name.endsWith(".js"));

  if (!file) {
    throw new Error("TypeScript did not emit JavaScript.");
  }

  return file.text;
}

function runInWorker(
  code: string,
  level: Level,
  locale: Locale,
  workerRef: MutableRefObject<Worker | null>,
  timeoutMessage: string,
): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./runner.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current?.terminate();
    workerRef.current = worker;

    const timeout = window.setTimeout(() => {
      worker.terminate();
      workerRef.current = null;
      resolve({
        status: "error",
        message: timeoutMessage,
        trace: [],
      });
    }, runTimeoutMs);

    worker.onmessage = (event: MessageEvent<RunResult>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      workerRef.current = null;
      resolve(event.data);
    };

    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      workerRef.current = null;
      resolve({
        status: "error",
        message: event.message,
        trace: [],
      });
    };

    worker.postMessage({ code, level, locale });
  });
}

function flattenDiagnosticMessage(message: unknown): string {
  if (typeof message === "string") {
    return message;
  }

  if (message && typeof message === "object" && "messageText" in message) {
    const next = message as { messageText: unknown; next?: unknown[] };
    const rest = next.next?.map(flattenDiagnosticMessage).join(" ") ?? "";
    return `${flattenDiagnosticMessage(next.messageText)} ${rest}`.trim();
  }

  return String(message);
}

function readSavedCode(): Record<string, string> {
  try {
    const saved = window.localStorage.getItem(savedCodeStorageKey);
    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
}

function writeSavedCode(savedCode: Record<string, string>) {
  try {
    window.localStorage.setItem(savedCodeStorageKey, JSON.stringify(savedCode));
  } catch {
    // Code drafts are a convenience. If storage is unavailable, the editor still works.
  }
}
