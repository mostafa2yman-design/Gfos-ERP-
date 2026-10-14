import { FinancialConfiguration, DEFAULT_FINANCIAL_CONFIG } from '../types/financialConfig';

const FINANCIAL_CONFIG_KEY = 'accounting_financial_configuration_v1';

export const getFinancialConfig = (): FinancialConfiguration => {
  try {
    const raw = localStorage.getItem(FINANCIAL_CONFIG_KEY);
    if (!raw) {
      saveFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
      return DEFAULT_FINANCIAL_CONFIG;
    }
    const parsed = JSON.parse(raw);
    // Deep merge with defaults to ensure any missing keys are gracefully handled
    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      mappings: {
        ...DEFAULT_FINANCIAL_CONFIG.mappings,
        ...(parsed.mappings || {})
      },
      policies: {
        ...DEFAULT_FINANCIAL_CONFIG.policies,
        ...(parsed.policies || {})
      },
      sequences: {
        ...DEFAULT_FINANCIAL_CONFIG.sequences,
        ...(parsed.sequences || {})
      }
    };
  } catch (error) {
    console.error('Failed to parse financial configuration:', error);
    return DEFAULT_FINANCIAL_CONFIG;
  }
};

export const saveFinancialConfig = (config: FinancialConfiguration): void => {
  try {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(FINANCIAL_CONFIG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('financial_config_updated', { detail: updated }));
  } catch (error) {
    console.error('Failed to save financial configuration:', error);
  }
};

export const resetFinancialConfigToDefaults = (): FinancialConfiguration => {
  saveFinancialConfig(DEFAULT_FINANCIAL_CONFIG);
  return DEFAULT_FINANCIAL_CONFIG;
};
