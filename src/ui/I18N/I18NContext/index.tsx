import React, { createContext, useContext, useEffect, useState } from "react";

interface I18NContextType {
  language: string;
  changeLanguage: (newLanguage: string) => void;
}

const I18NContext = createContext<I18NContextType | undefined>(undefined);

export const I18NProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<string>(() => {
    // Get the language from localStorage if it exists, otherwise default to "cn"
    return localStorage.getItem("language") || "cn";
  });

  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);

    //Force a reload of the page to apply the language change
    window.location.reload();
  };

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <I18NContext.Provider value={{ language, changeLanguage }}>
      {children}
    </I18NContext.Provider>
  );
};

export const useI18N = (): I18NContextType => {
  const context = useContext(I18NContext);
  if (!context) {
    throw new Error("useI18N must be used within a I18NProvider");
  }
  return context;
};
