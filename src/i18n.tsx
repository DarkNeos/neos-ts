import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import translationBrazilian from "./Translation/Brazilian/translation.json";
import translationChinese from "./Translation/Chinese/translation.json";
//Import all translation files
import translationEnglish from "./Translation/English/translation.json";
import translationFrench from "./Translation/French/translation.json";
import translationJapanese from "./Translation/Japanese/translation.json";
import translationPortuguese from "./Translation/Portuguese/translation.json";
import translationSpanish from "./Translation/Spanish/translation.json";

//---Using translation
// const resources = {
//     en: {
//         translation: translationEnglish,
//     },
//     es: {
//         translation: translationSpanish,
//     },
//     fr: {
//         translation: translationFrench,
//     },
// }

//---Using different namespaces
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
