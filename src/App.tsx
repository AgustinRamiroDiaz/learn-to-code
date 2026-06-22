import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";
import type { ReactNode } from "react";
import { type MutableRefObject, useRef, useState } from "react";
import {
  Button,
  ListBox,
  ListBoxItem,
  OverlayArrow,
  Tooltip,
  TooltipTrigger,
} from "react-aria-components";
import type { editor, Uri } from "monaco-editor";
import { gameApiTypes, levels } from "./level";
import type { Diagnostic, Level, RunResult } from "./types";
import WorldView from "./WorldView";

const modelPath = "file:///solution.ts";
const runTimeoutMs = 1000;

const idleResult: RunResult = {
  status: "idle",
  message: "Run your solution to see feedback.",
  trace: [],
};

export default function App() {
  const [activeLevel, setActiveLevel] = useState(levels[0]);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [code, setCode] = useState(activeLevel.starterCode);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [runResult, setRunResult] = useState<RunResult>(idleResult);
  const [isRunning, setIsRunning] = useState(false);

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
    setActiveLevel(level);
    setCode(level.starterCode);
    setDiagnostics([]);
    setRunResult(idleResult);
    editorRef.current?.setValue(level.starterCode);
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
      message: "Checking and running...",
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
          message: "Fix the TypeScript errors before running the level.",
          trace: [],
        });
        return;
      }

      const js = await emitJavaScript(monaco, model.uri);
      const result = await runInWorker(js, activeLevel, workerRef);
      setRunResult(result);
    } catch (error) {
      setRunResult({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not run the solution.",
        trace: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <main className="appShell">
      <section className="mainLayout">
        <aside className="levelSidebar">
          <ListBox
            className="react-aria-ListBox levelList"
            aria-label="Levels"
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
                  <strong>{level.name.replace(/^Level \d+: /, "")}</strong>
                </span>
              </ListBoxItem>
            ))}
          </ListBox>
        </aside>

        <div className="workspace">
          <div className="editorPane" aria-label="TypeScript editor">
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
                <InfoTip label="Level objective">{activeLevel.objective}</InfoTip>
                <InfoTip label="World goal">
                  Goal tile: x={activeLevel.goal.x}, y={activeLevel.goal.y}
                </InfoTip>
              </div>
              <div className="runPanelActions">
                <Button className="react-aria-Button appButton" onPress={run} isDisabled={isRunning}>
                  {isRunning ? "Running..." : "Run"}
                </Button>
                <Button className="react-aria-Button appButton secondary" onPress={reset}>
                  Reset
                </Button>
              </div>
            </div>
            <WorldView level={activeLevel} runResult={runResult} />
            <div className="runStatus">
              <h2>{statusTitle(runResult.status)}</h2>
              <p>{runResult.message}</p>
            </div>
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h3>Diagnostics</h3>
              <span>{diagnostics.length}</span>
            </div>
            {diagnostics.length === 0 ? (
              <p className="muted">Clean</p>
            ) : (
              <ul className="diagnosticList">
                {diagnostics.map((diagnostic, index) => (
                  <li key={`${diagnostic.line}-${diagnostic.column}-${index}`}>
                    <strong>{diagnostic.severity}</strong>
                    <span>
                      Line {diagnostic.line}, col {diagnostic.column}:{" "}
                      {diagnostic.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panelHeader">
              <h3>Trace</h3>
              <div className="panelTools">
                <InfoTip label="Trace hint">{activeLevel.hint}</InfoTip>
                <span>{runResult.trace.length}</span>
              </div>
            </div>
            {runResult.trace.length === 0 ? (
              <p className="muted">No steps yet</p>
            ) : (
              <ol className="traceList">
                {runResult.trace.map((entry) => (
                  <li key={entry.step}>
                    <code>{entry.action}</code>
                    <span>{entry.note}</span>
                    <small>
                      x={entry.state.x}, y={entry.state.y}
                    </small>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
        </div>
      </section>
    </main>
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
  workerRef: MutableRefObject<Worker | null>,
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
        message: "Execution timed out. Check for an infinite loop.",
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

    worker.postMessage({ code, level });
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

function statusTitle(status: RunResult["status"]) {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Needs work";
    case "error":
      return "Runtime error";
    case "running":
      return "Running";
    default:
      return "Ready";
  }
}
