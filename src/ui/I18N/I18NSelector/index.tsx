import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { Select } from "@/ui/Shared";

export const I18NSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const onClickLanguageChange = (language: any) => {
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    // Adding language state as a dependency to force re-render
    // when the language changes
  }, [i18n.language]);

  return (
    <Select
      value={i18n.language}
      onChange={onClickLanguageChange}
      options={[
        { value: "cn", label: "简体中文" },
        { value: "en", label: "English" },
        { value: "fr", label: "Français" },
        { value: "jp", label: "日本語" },
        { value: "br", label: "português do Brasil" },
        { value: "pt", label: "português" },
        { value: "es", label: "Castellano" },
      ]}
    />
  );
};
