import { Button } from "react-aria-components";
import type { copy } from "./i18n";
import LocaleSwitch from "./LocaleSwitch";
import type { Level, Locale } from "./types";
import { levelTitle } from "./uiUtils";

type LevelSelectViewProps = {
  levels: Level[];
  locale: Locale;
  t: (typeof copy)[Locale];
  onSelectLevel: (level: Level) => void;
  onSelectLocale: (locale: Locale) => void;
};

export default function LevelSelectView({
  levels,
  locale,
  t,
  onSelectLevel,
  onSelectLocale,
}: LevelSelectViewProps) {
  return (
    <section className="levelSelectView">
      <div className="levelSelectHeader">
        <div>
          <h1>{t.appTitle}</h1>
          <p>{t.chooseLevel}</p>
        </div>
        <LocaleSwitch
          label={t.language}
          locale={locale}
          onSelectLocale={onSelectLocale}
        />
      </div>

      <div className="levelCardGrid" aria-label={t.levels}>
        {levels.map((level, index) => (
          <Button
            key={level.id}
            className="react-aria-Button levelCard"
            onPress={() => onSelectLevel(level)}
          >
            <span className="levelNumber">{index + 1}</span>
            <span>
              <strong>{levelTitle(level.name)}</strong>
              <small>{level.objective}</small>
            </span>
            <span className="levelCardAction">{t.startLevel}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
