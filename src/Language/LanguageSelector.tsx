import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const onClickLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = e.target.value;
    i18n.changeLanguage(language);
  };

  useEffect(() => {
    //Adding language state as a dependency to force re-render when the language changes
  }, [i18n.language]);

  return (
    <select value={i18n.language} onChange={onClickLanguageChange}>
      <option value="cn">Chinese</option>
      <option value="en">English</option>
      <option value="fr">French</option>
      <option value="jp">Japanese</option>
      <option value="br">Brazilian</option>
      <option value="pt">Portuguese</option>
      <option value="es">Spanish</option>
    </select>
  );
};

export default LanguageSelector;
