import { Button } from "react-aria-components";
import { locales } from "./i18n";
import type { Locale } from "./types";

type LocaleSwitchProps = {
  label: string;
  locale: Locale;
  onSelectLocale: (locale: Locale) => void;
};

export default function LocaleSwitch({
  label,
  locale,
  onSelectLocale,
}: LocaleSwitchProps) {
  return (
    <div className="localeSwitch compact" aria-label={label}>
      {locales.map((item) => (
        <Button
          key={item.id}
          className={
            item.id === locale
              ? "react-aria-Button localeButton active"
              : "react-aria-Button localeButton"
          }
          aria-pressed={item.id === locale}
          onPress={() => onSelectLocale(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
