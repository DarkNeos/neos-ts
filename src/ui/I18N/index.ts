export * from "./I18NContext";
export * from "./I18NSelector";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

/* Import all translation files */
import translationBrazilian from "./Source/Brazilian/translation.json";
import translationChinese from "./Source/Chinese/translation.json";
import translationEnglish from "./Source/English/translation.json";
import translationFrench from "./Source/French/translation.json";
import translationJapanese from "./Source/Japanese/translation.json";
import translationPortuguese from "./Source/Portuguese/translation.json";
import translationSpanish from "./Source/Spanish/translation.json";

const resources = {
  cn: {
    Header: translationChinese.Header,
    Start: translationChinese.Start,
    Match: translationChinese.Match,
  },
  en: {
    Header: translationEnglish.Header,
    Start: translationEnglish.Start,
    Match: translationEnglish.Match,
  },
  es: {
    Header: translationSpanish.Header,
    Start: translationSpanish.Start,
    Match: translationSpanish.Match,
  },
  fr: {
    Header: translationFrench.Header,
    Start: translationFrench.Start,
    Match: translationFrench.Match,
  },
  jp: {
    Header: translationJapanese.Header,
    Start: translationJapanese.Start,
    Match: translationJapanese.Match,
  },
  br: {
    Header: translationBrazilian.Header,
    Start: translationBrazilian.Start,
    Match: translationBrazilian.Match,
  },
  pt: {
    Header: translationPortuguese.Header,
    Start: translationPortuguese.Start,
    Match: translationPortuguese.Match,
  },
};

i18next.use(initReactI18next).init({
  resources,
  lng: "cn", //default language
});

export default i18next;
