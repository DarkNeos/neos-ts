import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Select } from "@/ui/Shared";

import { useI18N } from "../I18NContext";

export const I18NSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { language, changeLanguage } = useI18N();

  const onClickLanguageChange = (language: any) => {
    changeLanguage(language);
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    // Adding language state as a dependency to force re-render
    // when the language changes
    i18n.changeLanguage(language);
  }, [i18n.language]);

  return (
    <Select
      value={i18n.language}
      onChange={onClickLanguageChange}
      options={[
        { value: "cn", label: "简体中文" },
        { value: "en", label: "English" },
        { value: "fr", label: "Français" },
        { value: "ja", label: "日本語" },
        { value: "br", label: "Português do Brasil" },
        { value: "pt", label: "Português" },
        { value: "es", label: "Castellano" },
      ]}
    />
  );
};
