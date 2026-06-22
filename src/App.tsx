import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type { ReactNode } from "react";
import { type MutableRefObject, useEffect, useRef, useState } from "react";
import {
  Button,
  I18nProvider,
  ListBox,
  ListBoxItem,
  OverlayArrow,
  Tooltip,
  TooltipTrigger,
} from "react-aria-components";
import type { editor, Uri } from "monaco-editor";
import { gameApiTypes, getLevels } from "./level";
import { copy, locales, localeTags } from "./i18n";
import type { Diagnostic, Level, Locale, RunResult } from "./types";
import WorldView from "./WorldView";

const modelPath = "file:///solution.ts";
const runTimeoutMs = 1000;

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = copy[locale];
  const levels = getLevels(locale);
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
  const [code, setCode] = useState(activeLevel.starterCode);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [runResult, setRunResult] = useState<RunResult>(idleResult);
  const [isRunning, setIsRunning] = useState(false);

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
    setCode(activeLevel.starterCode);
    setDiagnostics([]);
    setRunResult(idleResult);
    editorRef.current?.setValue(activeLevel.starterCode);
  };

  const selectLevel = (level: Level) => {
    setActiveLevelId(level.id);
    setCode(level.starterCode);
    setDiagnostics([]);
    setRunResult(idleResult);
    editorRef.current?.setValue(level.starterCode);
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

  return (
    <I18nProvider locale={localeTags[locale]}>
      <main className="appShell">
        <section className="mainLayout">
          <aside className="levelSidebar">
            <div className="localeSwitch" aria-label={t.language}>
              {locales.map((item) => (
                <Button
                  key={item.id}
                  className={
                    item.id === locale
                      ? "react-aria-Button localeButton active"
                      : "react-aria-Button localeButton"
                  }
                  aria-pressed={item.id === locale}
                  onPress={() => selectLocale(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <ListBox
              className="react-aria-ListBox levelList"
              aria-label={t.levels}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[activeLevel.id]}
              onSelectionChange={(keys) => {
                if (keys === "all") {
                  return;
                }

                const nextId = String([...keys][0]);
                const nextLevel = levels.find((level) => level.id === nextId);

                if (nextLevel) {
                  selectLevel(nextLevel);
                }
              }}
            >
              {levels.map((level, index) => (
                <ListBoxItem
                  key={level.id}
                  id={level.id}
                  textValue={level.name}
                  aria-label={`${level.name}: ${level.objective}`}
                  className="react-aria-ListBoxItem levelItem"
                >
                  <span className="levelNumber">{index + 1}</span>
                  <span>
                    <strong>{levelTitle(level.name)}</strong>
                  </span>
                </ListBoxItem>
              ))}
            </ListBox>
          </aside>

        <div className="workspace">
          <div className="editorPane" aria-label={t.typeScriptEditor}>
            <Editor
              height="100%"
              defaultLanguage="typescript"
              path={modelPath}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              onMount={handleEditorMount}
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

        <aside className="outputPane">
          <section className={`worldPanel ${runResult.status}`}>
            <div className="runPanelHeader">
              <div className="runPanelTools">
                <InfoTip label={t.levelObjective}>{activeLevel.objective}</InfoTip>
                <InfoTip label={t.worldGoal}>
                  {goalSummary(activeLevel, t)}
                </InfoTip>
              </div>
              <div className="runPanelActions">
                <Button className="react-aria-Button appButton" onPress={run} isDisabled={isRunning}>
                  {isRunning ? t.running : t.run}
                </Button>
                <Button className="react-aria-Button appButton secondary" onPress={reset}>
                  {t.reset}
                </Button>
              </div>
            </div>
            <WorldView level={activeLevel} runResult={runResult} />
            <div className="runStatus">
              <h2>{t.status[runResult.status]}</h2>
              <p>{runResult.message}</p>
            </div>
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h3>{t.diagnostics}</h3>
              <span>{diagnostics.length}</span>
            </div>
            {diagnostics.length === 0 ? (
              <p className="muted">{t.clean}</p>
            ) : (
              <ul className="diagnosticList">
                {diagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.line}-${diagnostic.column}-${index}`}>
                    <strong>{t.severity[diagnostic.severity]}</strong>
                    <span>
                      {t.diagnosticsLine} {diagnostic.line}, {t.diagnosticsColumn}{" "}
                      {diagnostic.column}:{" "}
                      {diagnostic.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h3>{t.trace}</h3>
              <div className="panelTools">
                <InfoTip label={t.traceHint}>{activeLevel.hint}</InfoTip>
                <span>{runResult.trace.length}</span>
              </div>
            </div>
            {runResult.trace.length === 0 ? (
              <p className="muted">{t.noSteps}</p>
            ) : (
              <ol className="traceList">
                {runResult.trace.map((entry) => (
                  <li key={entry.step}>
                    <code>{entry.action}</code>
                    <span>{entry.note}</span>
                    <small>{traceState(entry.state, t)}</small>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
        </div>
      </section>
    </main>
    </I18nProvider>
  );
}

function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <TooltipTrigger delay={250} closeDelay={100}>
      <Button
        className="react-aria-Button iconButton"
        aria-label={label}
      >
        ?
      </Button>
      <Tooltip className="react-aria-Tooltip appTooltip">
        <OverlayArrow>
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </OverlayArrow>
        {children}
      </Tooltip>
    </TooltipTrigger>
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

function levelTitle(name: string) {
  return name.replace(/^(Level|Nivel) \d+: /, "");
}

function goalSummary(level: Level, t: (typeof copy)[Locale]) {
  if (level.kind === "grid") {
    return `${t.goalTile}: x=${level.goal.x}, y=${level.goal.y}`;
  }

  if (level.kind === "stack") {
    return t.stackGoal;
  }

  if (level.kind === "queue") {
    return t.queueGoal;
  }

  return level.kind === "matrix" ? t.matrixGoal : t.treeGoal;
}

function traceState(
  state: RunResult["trace"][number]["state"],
  t: (typeof copy)[Locale],
) {
  if (typeof state.x === "number" && typeof state.y === "number") {
    return `x=${state.x}, y=${state.y}`;
  }

  if (state.visited) {
    return `${t.current}: ${state.current ?? "[]"} | ${t.visited}: ${formatStateItems(state.visited)}`;
  }

  return `${t.remaining}: ${formatStateItems(state.items)} | ${t.processed}: ${formatStateItems(state.processed)}`;
}

function formatStateItems(items?: string[]) {
  return items && items.length > 0 ? items.join(", ") : "[]";
}
