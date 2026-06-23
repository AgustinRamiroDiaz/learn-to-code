import { Button } from "react-aria-components";
import type { copy } from "./i18n";
import InfoTip from "./InfoTip";
import type { Diagnostic, Level, Locale, RunResult } from "./types";
import { goalSummary, traceState } from "./uiUtils";
import WorldView from "./WorldView";

type CollapsedPanels = {
  world: boolean;
  diagnostics: boolean;
  trace: boolean;
};

type OutputPanelsProps = {
  level: Level;
  runResult: RunResult;
  diagnostics: Diagnostic[];
  isRunning: boolean;
  collapsedPanels: CollapsedPanels;
  t: (typeof copy)[Locale];
  onRun: () => void;
  onReset: () => void;
  onTogglePanel: (panel: keyof CollapsedPanels) => void;
};

export default function OutputPanels({
  level,
  runResult,
  diagnostics,
  isRunning,
  collapsedPanels,
  t,
  onRun,
  onReset,
  onTogglePanel,
}: OutputPanelsProps) {
  return (
    <aside className="outputPane">
      <section
        className={
          collapsedPanels.world
            ? `worldPanel ${runResult.status} collapsed`
            : `worldPanel ${runResult.status}`
        }
      >
        <div className="runPanelHeader">
          <div className="runPanelTools">
            <Button
              className="react-aria-Button collapseButton"
              aria-label={`${collapsedPanels.world ? t.expand : t.collapse} ${t.worldGoal}`}
              aria-expanded={!collapsedPanels.world}
              onPress={() => onTogglePanel("world")}
            >
              {collapsedPanels.world ? "+" : "-"}
            </Button>
            <InfoTip label={t.levelObjective}>{level.objective}</InfoTip>
            <InfoTip label={t.worldGoal}>{goalSummary(level, t)}</InfoTip>
          </div>
          <div className="runPanelActions">
            <Button
              className="react-aria-Button appButton"
              onPress={onRun}
              isDisabled={isRunning}
            >
              {isRunning ? t.running : t.run}
            </Button>
            <Button
              className="react-aria-Button appButton secondary"
              onPress={onReset}
            >
              {t.reset}
            </Button>
          </div>
        </div>
        <div className="worldPanelBody">
          <WorldView level={level} runResult={runResult} />
          <div className="runStatus">
            <h2>{t.status[runResult.status]}</h2>
            <p>{runResult.message}</p>
          </div>
        </div>
      </section>

      <section
        className={collapsedPanels.diagnostics ? "panel collapsed" : "panel"}
      >
        <div className="panelHeader">
          <div className="panelTitleRow">
            <Button
              className="react-aria-Button collapseButton"
              aria-label={`${collapsedPanels.diagnostics ? t.expand : t.collapse} ${t.diagnostics}`}
              aria-expanded={!collapsedPanels.diagnostics}
              onPress={() => onTogglePanel("diagnostics")}
            >
              {collapsedPanels.diagnostics ? "+" : "-"}
            </Button>
            <h3>{t.diagnostics}</h3>
          </div>
          <span>{diagnostics.length}</span>
        </div>
        <div className="panelBody">
          {diagnostics.length === 0 ? (
            <p className="muted">{t.clean}</p>
          ) : (
            <ul className="diagnosticList">
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.line}-${diagnostic.column}-${index}`}>
                  <strong>{t.severity[diagnostic.severity]}</strong>
                  <span>
                    {t.diagnosticsLine} {diagnostic.line},{" "}
                    {t.diagnosticsColumn} {diagnostic.column}:{" "}
                    {diagnostic.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={collapsedPanels.trace ? "panel collapsed" : "panel"}>
        <div className="panelHeader">
          <div className="panelTitleRow">
            <Button
              className="react-aria-Button collapseButton"
              aria-label={`${collapsedPanels.trace ? t.expand : t.collapse} ${t.trace}`}
              aria-expanded={!collapsedPanels.trace}
              onPress={() => onTogglePanel("trace")}
            >
              {collapsedPanels.trace ? "+" : "-"}
            </Button>
            <h3>{t.trace}</h3>
          </div>
          <div className="panelTools">
            <InfoTip label={t.traceHint}>{level.hint}</InfoTip>
            <span>{runResult.trace.length}</span>
          </div>
        </div>
        <div className="panelBody">
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
        </div>
      </section>
    </aside>
  );
}
