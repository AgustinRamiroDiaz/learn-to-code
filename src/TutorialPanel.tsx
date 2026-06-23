import type { copy } from "./i18n";
import type { Level, Locale } from "./types";

type TutorialPanelProps = {
  level: Level;
  t: (typeof copy)[Locale];
};

export default function TutorialPanel({ level, t }: TutorialPanelProps) {
  return (
    <aside className="tutorialPanel">
      <div>
        <span className="eyebrow">{t.levelObjective}</span>
        <h2>{level.conceptTitle}</h2>
        <p>{level.objective}</p>
      </div>

      <ol className="conceptList">
        {level.concept.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      <div className="hintBlock">
        <strong>{t.traceHint}</strong>
        <p>{level.hint}</p>
      </div>
    </aside>
  );
}
