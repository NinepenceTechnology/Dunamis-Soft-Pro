import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  pt: {
    translation: {
      dashboard: "Painel de Controle",
      customers: "Clientes",
      products: "Produtos",
      finance: "Financeiro",
      inventory: "Inventário",
      statistics: "Estatísticas",
      calculator: "Calculadora",
      hr: "Recursos Humanos",
      stores: "Lojas",
      reports: "Relatórios",
      settings: "Configurações",
      calendar: "Agenda",
      treatments: "Serviços",
      expenses: "Despesas",
      new: "Novo",
      new_invoice: "Nova Fatura",
      stock_critical: "Stock Crítico",
      total_customers: "Total de Clientes",
      revenue: "Receita",
      prediction: "Previsão de Vendas (IA)",
      developed_by: "desenvolvido por:",
      login_google: "Entrar com Google",
      role: "Cargo",
      admin: "Administrador",
      manager: "Gerente",
      operator: "Operador",
      shifts: "Turnos",
      productivity: "Produtividade",
      performance: "Desempenho",
      qr_code: "QR Code Fiscal",
      export_accounting: "Exportar Contabilidade",
      audit_logs: "Logs de Auditoria",
      guide: "Guia do Usuário"
    }
  },
  en: {
    translation: {
      dashboard: "Dashboard",
      customers: "Customers",
      products: "Products",
      finance: "Finance",
      inventory: "Inventory",
      statistics: "Statistics",
      calculator: "Calculator",
      hr: "Human Resources",
      stores: "Stores",
      reports: "Reports",
      settings: "Settings",
      calendar: "Schedule",
      treatments: "Services",
      expenses: "Expenses",
      new: "New",
      new_invoice: "New Invoice",
      stock_critical: "Critical Stock",
      total_customers: "Total Customers",
      revenue: "Revenue",
      prediction: "Sales Prediction (AI)",
      developed_by: "developed by:",
      login_google: "Login with Google",
      role: "Role",
      admin: "Administrator",
      manager: "Manager",
      operator: "Operator",
      shifts: "Shifts",
      productivity: "Productivity",
      performance: "Performance",
      qr_code: "Fiscal QR Code",
      export_accounting: "Export Accounting",
      audit_logs: "Audit Logs",
      guide: "User Guide"
    }
  },
  es: {
    translation: {
      dashboard: "Panel de Control",
      customers: "Clientes",
      products: "Productos",
      finance: "Finanzas",
      inventory: "Inventario",
      statistics: "Estadísticas",
      calculator: "Calculadora",
      hr: "Recursos Humanos",
      stores: "Tiendas",
      reports: "Informes",
      settings: "Configuración",
      calendar: "Agenda",
      treatments: "Servicios",
      expenses: "Gastos",
      new: "Nuevo",
      new_invoice: "Nueva Factura",
      stock_critical: "Stock Crítico",
      total_customers: "Total de Clientes",
      revenue: "Ingresos",
      prediction: "Predicción de Ventas (IA)",
      developed_by: "desarrollado por:",
      login_google: "Entrar con Google",
      role: "Cargo",
      admin: "Administrador",
      manager: "Gerente",
      operator: "Operador",
      shifts: "Turnos",
      productivity: "Productividad",
      performance: "Desempeño",
      qr_code: "Código QR Fiscal",
      export_accounting: "Exportar Contabilidad",
      audit_logs: "Logs de Auditoría",
      guide: "Guía del Usuario"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
