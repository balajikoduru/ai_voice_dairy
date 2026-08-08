"use client";

import { UI_LANGS, useLang } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-neutral-200 p-1 dark:border-neutral-800"
      role="group"
      aria-label="Language"
    >
      {UI_LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            lang === code
              ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
              : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
