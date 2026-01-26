
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Budget, Investment, BankAccount } from "../types";

export interface ExchangeRateResponse {
  rate: number;
  sourceUrl?: string;
}

export interface AssetLookupResponse {
  name: string;
  price: number;
}

export class FinanceAIService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("❌ ERROR: API_KEY no configurada. Las funciones de IA no funcionarán.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || "" });
  }

  async getExchangeRate(): Promise<ExchangeRateResponse> {
    if (!process.env.API_KEY) return { rate: 45.50 };
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Busca la tasa de cambio oficial vigente del Banco Central de Venezuela (BCV) USD a VES para el día de hoy. Si no hay datos de hoy, busca la más reciente. Devuelve el resultado en formato JSON con la propiedad 'rate' como número.",
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rate: { type: Type.NUMBER, description: "La tasa de cambio numérica" }
            },
            required: ["rate"]
          },
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const data = JSON.parse(response.text);
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sourceUrl = groundingChunks?.[0]?.web?.uri;

      return {
        rate: data.rate || 45.50,
        sourceUrl
      };
    } catch (error) {
      console.error("AI Rate Sync Error:", error);
      return { rate: 45.50 };
    }
  }

  async lookupAssetInfo(ticker: string): Promise<AssetLookupResponse | null> {
    if (!process.env.API_KEY) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Busca el nombre oficial y el precio de mercado actual de la acción o criptomoneda con ticker: ${ticker}. Responde en formato JSON.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nombre completo descriptivo del activo" },
              price: { type: Type.NUMBER, description: "Precio actual de mercado en USD" }
            },
            required: ["name", "price"]
          },
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      
      const text = response.text;
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("Error buscando activo:", error);
      return null;
    }
  }

  async analyzeFinances(
    transactions: Transaction[], 
    budgets: Budget[], 
    investments: Investment[]
  ) {
    if (!process.env.API_KEY) {
      return { 
        summary: "⚠️ API KEY no configurada. No se puede realizar el análisis.", 
        warnings: ["Configura tu llave en los ajustes de Vercel/Ambiente"], 
        opportunities: [], 
        score: 0 
      };
    }

    const personalTransactions = transactions.filter(t => !t.isWorkRelated && !t.isThirdParty);
    
    const prompt = `
      Actúa como un asesor financiero experto. Analiza la situación PERSONAL del usuario:
      
      DATOS PERSONALES (Usa esto para el Score y el Resumen):
      - Transacciones Personales: ${JSON.stringify(personalTransactions.slice(0, 50))}
      - Presupuestos: ${JSON.stringify(budgets)}
      - Inversiones: ${JSON.stringify(investments)}

      REGLA DE ORO:
      Ignora cualquier flujo que no sea gasto personal o ingreso propio. Los fondos de trabajo y de terceros (custodia) NO son parte de la salud financiera personal del usuario, son pasivos temporales.

      Genera un informe detallado en JSON con:
      1. 'summary': Resumen de su economía real.
      2. 'warnings': Alertas de gastos personales excesivos.
      3. 'opportunities': Consejos de inversión o ahorro.
      4. 'score': Salud financiera de 0 a 100 basada SOLO en lo personal.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
              opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
              score: { type: Type.NUMBER }
            },
            required: ["summary", "warnings", "opportunities", "score"]
          },
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Respuesta vacía de la IA");
      return JSON.parse(text);
    } catch (error) {
      console.error("Error en análisis financiero IA:", error);
      return { 
        summary: "No se pudo generar el análisis en este momento.", 
        warnings: ["Error de conexión con la IA"], 
        opportunities: ["Intenta de nuevo más tarde"], 
        score: 0 
      };
    }
  }

  async chatWithData(message: string, context: { transactions: Transaction[], accounts: BankAccount[] }) {
    if (!process.env.API_KEY) return "Lo siento, la función de chat requiere una API Key configurada.";

    const systemInstruction = `
      Eres el asistente financiero personal de Finanza360. 
      Instrucciones Críticas:
      1. Tienes tres cubetas: PERSONAL, LABORAL (Pote Trabajo) y CUSTODIA (Dinero de otros).
      2. No mezcles los totales. Si el usuario pregunta "cuánto tengo", aclara si te refieres a su dinero neto personal o al saldo total en bancos (que incluye dinero de otros).
      3. Responde de forma muy concisa en Español.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text;
    } catch (error) {
      console.error("Error en chat IA:", error);
      return "Hubo un error en el chat.";
    }
  }
}
