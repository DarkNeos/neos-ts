// Define the possible language codes (I18N)
type Language = "en" | "br" | "pt" | "fr" | "ja" | "ko" | "es" | "cn";

// Define the structure for the messages (I18N)
const messages: Record<
  Language,
  {
    drawPhase: string;
    standbyPhase: string;
    mainPhase1: string;
    battlePhase: string;
    battleStart: string;
    battleStep: string;
    damage: string;
    damageCalc: string;
    mainPhase2: string;
    endPhase: string;
    allChain?: string;
    ignoreChain?: string;
    smartChain?: string;
    availableChain?: string;
    unknown: string;
  }
> = {
  en: {
    drawPhase: "Draw",
    standbyPhase: "Standby Phase",
    mainPhase1: "Main Phase 1",
    battlePhase: "Battle Phase",
    battleStart: "Battle Start",
    battleStep: "Battle Step",
    damage: "Damage Step",
    damageCalc: "Damage Step (Damage Calculation)",
    mainPhase2: "Main Phase 2",
    endPhase: "End Phase",
    allChain: "All Chain",
    ignoreChain: "Ignore Chain",
    smartChain: "Smart Chain",
    availableChain: "Available Chain",
    unknown: "Unknown",
  },
  br: {
    drawPhase: "Compra",
    standbyPhase: "Fase de Espera",
    mainPhase1: "Fase Principal 1",
    battlePhase: "Fase de Batalha",
    battleStart: "Início da Batalha",
    battleStep: "Fase da Batalha",
    damage: "Fase de Dano",
    damageCalc: "Fase de Dano (Cálculo de Dano)",
    mainPhase2: "Fase Principal 2",
    endPhase: "Fase Final",
    unknown: "Desconhecido",
  },
  pt: {
    drawPhase: "Compra",
    standbyPhase: "Fase de Espera",
    mainPhase1: "Fase Principal 1",
    battlePhase: "Fase de Batalha",
    battleStart: "Início da Batalha",
    battleStep: "Fase da Batalha",
    damage: "Fase de Dano",
    damageCalc: "Fase de Dano (Cálculo de Dano)",
    mainPhase2: "Fase Principal 2",
    endPhase: "Fase Final",
    unknown: "Desconhecido",
  },
  fr: {
    drawPhase: "Pioche",
    standbyPhase: "Phase de Standby",
    mainPhase1: "Phase Principale 1",
    battlePhase: "Phase de Bataille",
    battleStart: "Début de la Bataille",
    battleStep: "Étape de Bataille",
    damage: "Étape de Dégâts",
    damageCalc: "Étape de Dégâts (Calcul des Dégâts)",
    mainPhase2: "Phase Principale 2",
    endPhase: "Phase Finale",
    unknown: "Inconnu",
  },
  ja: {
    drawPhase: "ドロー",
    standbyPhase: "スタンバイフェイズ",
    mainPhase1: "メインフェイズ 1",
    battlePhase: "バトルフェイズ",
    battleStart: "バトル開始",
    battleStep: "バトルステップ",
    damage: "ダメージステップ",
    damageCalc: "ダメージステップ（ダメージ計算）",
    mainPhase2: "メインフェイズ 2",
    endPhase: "エンドフェイズ",
    unknown: "未知",
  },
  ko: {
    drawPhase: "드로우",
    standbyPhase: "대기 페이즈",
    mainPhase1: "메인 페이즈 1",
    battlePhase: "배틀 페이즈",
    battleStart: "배틀 시작",
    battleStep: "배틀 스텝",
    damage: "데미지 스텝",
    damageCalc: "데미지 스텝 (데미지 계산)",
    mainPhase2: "메인 페이즈 2",
    endPhase: "엔드 페이즈",
    unknown: "알 수 없음",
  },
  es: {
    drawPhase: "Robo",
    standbyPhase: "Fase de Espera",
    mainPhase1: "Fase Principal 1",
    battlePhase: "Fase de Batalla",
    battleStart: "Inicio de Batalla",
    battleStep: "Paso de Batalla",
    damage: "Paso de Daño",
    damageCalc: "Paso de Daño (Cálculo de Daño)",
    mainPhase2: "Fase Principal 2",
    endPhase: "Fase Final",
    unknown: "Desconocido",
  },
  cn: {
    drawPhase: "抽卡阶段",
    standbyPhase: "准备阶段",
    mainPhase1: "主要阶段 1",
    battlePhase: "战斗阶段",
    battleStart: "战斗开始",
    battleStep: "战斗步骤",
    damage: "伤害步骤",
    damageCalc: "伤害步骤（伤害计算）",
    mainPhase2: "主要阶段 2",
    endPhase: "结束阶段",
    allChain: "全部连锁",
    ignoreChain: "忽略连锁",
    smartChain: "智能连锁",
    availableChain: "可用连锁",
    unknown: "未知阶段",
  },
};

// Get the language from localStorage or default to 'cn' (I18N)
const storedLanguage = localStorage.getItem("language") as Language;
const language = storedLanguage in messages ? storedLanguage : "cn";
export const drawPhase = messages[language].drawPhase;
export const standbyPhase = messages[language].standbyPhase;
export const mainPhase1 = messages[language].mainPhase1;
export const battlePhase = messages[language].battlePhase;
export const battleStart = messages[language].battleStart;
export const battleStep = messages[language].battleStep;
export const damage = messages[language].damage;
export const damageCalc = messages[language].damageCalc;
export const mainPhase2 = messages[language].mainPhase2;
export const endPhase = messages[language].endPhase;
export const allChain = messages[language].allChain ?? "All Chain";
export const ignoreChain = messages[language].ignoreChain ?? "Ignore Chain";
export const smartChain = messages[language].smartChain ?? "Smart Chain";
export const unknown = messages[language].unknown;
/* End of definition (I18N) */

export const availableChain =
  messages[language].availableChain ?? "Available Chain";
