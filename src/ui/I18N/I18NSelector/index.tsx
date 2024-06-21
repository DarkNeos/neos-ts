import { Checkbox, Col, Row, Tooltip } from "antd";
import React, { useEffect } from "react";
import { FlagIcon, FlagIconCode } from "react-flag-kit";
import { useTranslation } from "react-i18next";

import { useI18N } from "../I18NContext";

const languageOptions: { value: string; label: string; flag: FlagIconCode }[] =
  [
    { value: "cn", label: "简体中文", flag: "CN" as FlagIconCode },
    { value: "en", label: "English", flag: "US" as FlagIconCode },
    { value: "fr", label: "Français", flag: "FR" as FlagIconCode },
    { value: "ja", label: "日本語", flag: "JP" as FlagIconCode },
    { value: "br", label: "Português do Brasil", flag: "BR" as FlagIconCode },
    { value: "pt", label: "Português", flag: "PT" as FlagIconCode },
    { value: "es", label: "Castellano", flag: "ES" as FlagIconCode },
  ];

export const I18NSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { language, changeLanguage } = useI18N();

  const onClickLanguageChange = (selectedLanguage: string) => {
    changeLanguage(selectedLanguage);
    i18n.changeLanguage(selectedLanguage);
  };

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <Row gutter={[16, 16]}>
      {languageOptions.map((lang) => (
        <Col key={lang.value}>
          <Tooltip title={lang.label}>
            <Checkbox
              checked={i18n.language === lang.value}
              onChange={() => onClickLanguageChange(lang.value)}
            >
              <FlagIcon code={lang.flag} size={24} />
            </Checkbox>
          </Tooltip>
        </Col>
      ))}
    </Row>
  );
};
