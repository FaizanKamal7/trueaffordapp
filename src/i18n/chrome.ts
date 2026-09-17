import type { LocaleCode } from "./locales";

export interface ChromeCopy {
  skipToContent: string;
  nav: {
    homeAffordability: string;
    mortgageCalculator: string;
    methodology: string;
    changeLanguage: string;
    switchColorTheme: string;
    switchToDarkMode: string;
    switchToLightMode: string;
  };
  footer: {
    tagline: string;
    calculatorsHeading: string;
    browseHeading: string;
    aboutHeading: string;
    homeAffordabilityCalculator: string;
    houseAffordabilityCalculator: string;
    mortgageCalculator: string;
    rentAffordabilityCalculator: string;
    rentVsBuyCalculator: string;
    budgetCalculator: string;
    amortizationScheduleCalculator: string;
    closingCostsCalculator: string;
    carAffordabilityCalculator: string;
    byIncome: string;
    byState: string;
    methodology: string;
    companyHeading: string;
    legalHeading: string;
    aboutUs: string;
    contactUs: string;
    privacyPolicy: string;
    termsAndConditions: string;
  };
  shell: {
    faqHeading: string;
    relatedLabel: string;
  };
}

export const CHROME: Record<LocaleCode, ChromeCopy> = {
  en: {
    skipToContent: "Skip to content",
    nav: {
      homeAffordability: "Home Affordability",
      mortgageCalculator: "Mortgage Calculator",
      methodology: "Methodology",
      changeLanguage: "Change language",
      switchColorTheme: "Switch color theme",
      switchToDarkMode: "Switch to dark mode",
      switchToLightMode: "Switch to light mode",
    },
    footer: {
      tagline: "Every affordability calculator online is owned by a company that sells mortgage leads. This one isn't. No ads in the results, no lead forms, no accounts.",
      calculatorsHeading: "Calculators",
      browseHeading: "Browse",
      aboutHeading: "About",
      homeAffordabilityCalculator: "Home Affordability Calculator",
      houseAffordabilityCalculator: "House Affordability Calculator",
      mortgageCalculator: "Mortgage Calculator",
      rentAffordabilityCalculator: "Rent Affordability Calculator",
      rentVsBuyCalculator: "Rent vs. Buy Calculator",
      budgetCalculator: "Budget Calculator",
      amortizationScheduleCalculator: "Amortization Schedule Calculator",
      closingCostsCalculator: "Closing Costs Calculator",
      carAffordabilityCalculator: "Car Affordability Calculator",
      byIncome: "By Income",
      byState: "By State",
      methodology: "Methodology",
      companyHeading: "Company",
      legalHeading: "Legal",
      aboutUs: "About Us",
      contactUs: "Contact Us",
      privacyPolicy: "Privacy Policy",
      termsAndConditions: "Terms & Conditions",
    },
    shell: {
      faqHeading: "Frequently asked questions",
      relatedLabel: "Related:",
    },
  },
  es: {
    skipToContent: "Saltar al contenido",
    nav: {
      homeAffordability: "Asequibilidad de Vivienda",
      mortgageCalculator: "Calculadora de Hipoteca",
      methodology: "Metodología",
      changeLanguage: "Cambiar idioma",
      switchColorTheme: "Cambiar tema de color",
      switchToDarkMode: "Cambiar a modo oscuro",
      switchToLightMode: "Cambiar a modo claro",
    },
    footer: {
      tagline: "Todas las demás calculadoras de asequibilidad en línea pertenecen a una empresa que vende contactos hipotecarios. Esta no. Sin anuncios en los resultados, sin formularios de captación de clientes, sin cuentas.",
      calculatorsHeading: "Calculadoras",
      browseHeading: "Explorar",
      aboutHeading: "Acerca de",
      homeAffordabilityCalculator: "Calculadora de Asequibilidad de Vivienda",
      houseAffordabilityCalculator: "Calculadora de Asequibilidad de Casa",
      mortgageCalculator: "Calculadora de Hipoteca",
      rentAffordabilityCalculator: "Calculadora de Asequibilidad de Alquiler",
      rentVsBuyCalculator: "Calculadora de Alquilar vs. Comprar",
      budgetCalculator: "Calculadora de Presupuesto",
      amortizationScheduleCalculator: "Calculadora de Tabla de Amortización",
      closingCostsCalculator: "Calculadora de Costos de Cierre",
      carAffordabilityCalculator: "Calculadora de Asequibilidad de Auto",
      byIncome: "Por Ingreso",
      byState: "Por Estado",
      methodology: "Metodología",
      companyHeading: "Empresa",
      legalHeading: "Legal",
      aboutUs: "Sobre Nosotros",
      contactUs: "Contáctanos",
      privacyPolicy: "Política de Privacidad",
      termsAndConditions: "Términos y Condiciones",
    },
    shell: {
      faqHeading: "Preguntas frecuentes",
      relatedLabel: "Relacionado:",
    },
  },
};
