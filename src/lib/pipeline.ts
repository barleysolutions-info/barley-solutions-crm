export const STAGE_KEYS = [
  "new_lead",
  "contacted",
  "qualified",
  "kickoff",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

/** Stages that form the linear "spine" of the pipeline (excludes the won/lost fork). */
export const ACTIVE_STAGES: StageKey[] = [
  "new_lead",
  "contacted",
  "qualified",
  "kickoff",
  "proposal",
  "negotiation",
];

export type TodoGroup = { heading: string; items: string[] };
export type RequiredField = { label: string; description: string };

export type Stage = {
  key: StageKey;
  num: string; // "1".."6", "7A", "7B"
  title: string;
  subtitle: string;
  description: string;
  todoGroups: TodoGroup[];
  requiredField?: RequiredField;
  preCloseChecklist?: { heading: string; items: string[] };
  output: string;
  next: string; // "Další krok: …"
  nextStageKey: StageKey | null;
  tone: "default" | "won" | "lost";
  followUpDays: number | null;
  /** Short 1-liner for the Lead DB kanban column header — single source of
   *  truth shared with the Roadmap tab (both import from this file). */
  columnBlurb: string;
};

export const STAGES: Stage[] = [
  {
    key: "new_lead",
    num: "1",
    title: "Nový lead",
    subtitle: "Založení v CRM",
    description:
      "Do CRM přišel nový kontakt. Zatím nevíme nic, jen že existuje. Cílem kroku je, aby nikdy nezmizel ze systému.",
    todoGroups: [
      {
        heading: "To do",
        items: [
          "Založit kartu klienta v CRM",
          "Vyplnit jméno, firmu, telefon, e-mail, web",
          "Zapsat zdroj leadu a datum vzniku",
          "Nastavit stage „Nový lead“ a vlastníka dealu",
          "Nastavit úkol na první dotyk (do 24 hodin)",
        ],
      },
    ],
    output: "Kompletní karta v CRM se zdrojem, datem a naplánovaným prvním dotykem.",
    next: "Další krok: 2. Oslovení",
    nextStageKey: "contacted",
    tone: "default",
    followUpDays: 1,
    columnBlurb: "Zapiš kontakt do CRM a naplánuj první dotyk do 24 hodin.",
  },
  {
    key: "contacted",
    num: "2",
    title: "Oslovení",
    subtitle: "Inbound / Outbound",
    description:
      "Buď přišel klient za námi (inbound), nebo jdeme my za ním (outbound). Kanál se vždy zapisuje do CRM, jinak nevíme, co funguje.",
    todoGroups: [
      {
        heading: "To do - inbound (oslovení klientem)",
        items: [
          "Kontaktní formulář",
          "Schůzka v Calendly",
          "Zavolá",
          "Napíše mail",
          "Napíše na sociální sítě",
        ],
      },
      {
        heading: "To do - outbound (oslovujeme klienta)",
        items: ["Cold call", "E-mail", "AI Emailer", "Přes sociální sítě", "Poptávka"],
      },
    ],
    output:
      "První reakce klienta a v CRM zapsaný kanál, kterým k nám přišel nebo kterým jsme ho oslovili.",
    next: "Další krok: 3. Kvalifikace",
    nextStageKey: "qualified",
    tone: "default",
    followUpDays: 3,
    columnBlurb: "Zaznamenej kanál (inbound/outbound) a čekej na první reakci.",
  },
  {
    key: "qualified",
    num: "3",
    title: "Kvalifikace",
    subtitle: "Chovej se jako doktor",
    description:
      "Klient projevil zájem. Teď se neprodává, teď se diagnostikuje. Doktor nepředepisuje lék před vyšetřením.",
    todoGroups: [
      {
        heading: "To do",
        items: [
          "Co klient řeší za problém?",
          "Do kdy to potřebuje?",
          "Zapsat odpovědi doslova do CRM",
          "Domluvit termín kick-off callu na 30 minut",
        ],
      },
    ],
    output: "Kvalifikovaný lead: známý problém, známý termín, potvrzený kick-off v kalendáři.",
    next: "Další krok: 4. Kick-off",
    nextStageKey: "kickoff",
    tone: "default",
    followUpDays: 2,
    columnBlurb: "Zjisti problém a termín — kvalifikuj, neprodávej.",
  },
  {
    key: "kickoff",
    num: "4",
    title: "Kick-off",
    subtitle: "Call na 30 minut",
    description:
      "Mluví hlavně klient. Od začátku zdůraznit, že schůzka je nezávazná. Ty se ptáš a zapisuješ.",
    todoGroups: [
      {
        heading: "To do - zjistit",
        items: [
          "Co teď mají (web, marketing, systémy)",
          "Kolik jim chodí zákazníků",
          "Kolik vydělá jeden zákazník",
          "Co se stane, když neudělají nic",
          "Kdo kromě něj rozhoduje",
          "Vyplnit Dokumentaci klienta přímo během callu",
        ],
      },
    ],
    requiredField: {
      label: "Povinné číslo do CRM",
      description:
        "Jakou má hodnotu jeden zákazník pro našeho klienta. Bez tohoto čísla se deal neposouvá dál.",
    },
    preCloseChecklist: {
      heading: "Před ukončením callu",
      items: [
        "Stanovit konkrétní termín poslání nabídky",
        "Definovat další kroky na obou stranách",
      ],
    },
    output: "Vyplněná dokumentace klienta, hodnota zákazníka v CRM a datum, kdy odchází nabídka.",
    next: "Další krok: 5. Nabídka",
    nextStageKey: "proposal",
    tone: "default",
    followUpDays: 2,
    columnBlurb: "Veď 30minutový call, zjisti hodnotu zákazníka, domluv termín nabídky.",
  },
  {
    key: "proposal",
    num: "5",
    title: "Nabídka",
    subtitle: "E-mail s návrhem řešení",
    description:
      "Nabídka odchází mailem v domluveném termínu. Vždy je v ní napsané, že ji můžeme dál probrat a že není finální.",
    todoGroups: [
      {
        heading: "To do",
        items: [
          "Poslat nabídku do slíbeného termínu, ne později",
          "Vrátit v ní problém klienta jeho vlastními slovy",
          "Zdůraznit, že nabídka není finální a dá se upravit",
          "Přiložit relevantní case study",
          "Nastavit v CRM úkol na follow-up",
        ],
      },
    ],
    output: "Odeslaná nabídka v CRM a naplánovaný termín dalšího kontaktu.",
    next: "Další krok: 6. Vyjednávání",
    nextStageKey: "negotiation",
    tone: "default",
    followUpDays: 3,
    columnBlurb: "Pošli nabídku do slíbeného termínu a naplánuj follow-up.",
  },
  {
    key: "negotiation",
    num: "6",
    title: "Vyjednávání",
    subtitle: "Ano, nebo zpět na kick-off",
    description:
      "Klient buď souhlasí, nebo máme námitku. Námitka není odmítnutí, je to chybějící informace. V tom případě se vracíme na krok 4 a doptáváme se.",
    todoGroups: [
      {
        heading: "To do",
        items: [
          "Pojmenovat konkrétní námitku (cena, čas, důvěra, rozhodovatel)",
          "Námitku porovnat s hodnotou jednoho zákazníka z kroku 4",
          "Upravit rozsah, ne cenu",
          "Chybí informace? Zpět na krok 4 a doptat se",
          "Zapsat výsledek do CRM tentýž den",
        ],
      },
    ],
    output: "Rozhodnutí. Ano vede na Closed, ne vede na Lost, nejasno vede zpět na krok 4.",
    next: "Další krok: 7. Closed nebo Lost",
    nextStageKey: null, // fork — UI nabízí "Closed", "Lost", a "zpět na Kick-off" explicitně
    tone: "default",
    followUpDays: 2,
    columnBlurb: "Vyřeš námitku, nebo se vrať na kick-off pro chybějící info.",
  },
  {
    key: "won",
    num: "7A",
    title: "Closed",
    subtitle: "Podepsáno",
    description:
      "Deal je uzavřený. Teď začíná část, která rozhoduje o tom, jestli z jednoho klienta bude jeden projekt, nebo tři roky příjmu.",
    todoGroups: [
      {
        heading: "To do - do 24 hodin",
        items: [
          "Poslat onboarding balíček",
          "Zálohová faktura",
          "Kde budeme komunikovat",
          "Termín dalšího kontaktu",
        ],
      },
      {
        heading: "To do - dál v čase",
        items: [
          "V polovině projektu: nabídnout rozšíření (SEO, obsah, sociální sítě, správa)",
          "30 dní po spuštění: report výsledků, progress check a nabídka měsíčního retaineru",
          "Při předání: požádat o hodnocení na Google",
          "Při předání: požádat o dva konkrétní kontakty",
        ],
      },
    ],
    output:
      "Zaplacená záloha, spuštěný projekt, hodnocení na Google a dva nové leady zpět do kroku 1.",
    next: "Další krok: 1. Nový lead (z doporučení)",
    nextStageKey: null,
    tone: "won",
    followUpDays: 30,
    columnBlurb: "Onboarduj do 24 hodin, pak pečuj a žádej o reference.",
  },
  {
    key: "lost",
    num: "7B",
    title: "Lost",
    subtitle: "Ztracený deal",
    description:
      "Ztracený deal není smazaný deal. Bez důvodu ztráty se z něj nikdy nic nenaučíš a za 90 dní už ho nedohledáš.",
    requiredField: {
      label: "Povinné pole",
      description: "Důvod ztráty. Bez něj se deal v CRM nedá zavřít.",
    },
    todoGroups: [
      {
        heading: "To do - ghost nebo nezájem",
        items: [
          "Dojet sedmidotykovou sekvenci (7 follow-upů)",
          "Poslat breakup mail až po sedmém dotyku",
          "Nastavit reminder na 90 dní od posledního follow-upu",
          "Po 90 dnech poslat připomenutí s novým důvodem k reakci",
        ],
      },
    ],
    output: "Zavřený deal s důvodem ztráty a naplánovaný reminder na 90 dní. Nic neskončí tichem.",
    next: "Další krok: Reminder za 90 dní, pak zpět na krok 2",
    nextStageKey: null,
    tone: "lost",
    followUpDays: 90,
    columnBlurb: "Zapiš důvod ztráty, dojeď 7 dotyků, nastav 90denní reminder.",
  },
];

export function getStage(key: string | undefined): Stage | undefined {
  return STAGES.find((s) => s.key === key);
}

export function stageLabel(key: string): string {
  return getStage(key)?.title ?? key;
}

export const LEAD_SOURCES = [
  { value: "cold", label: "Cold" },
  { value: "warm", label: "Warm" },
  { value: "referral", label: "Referral" },
] as const;
