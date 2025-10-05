import axios from "axios";

interface VerifyInstanceKeyParams {
  url: string;
  apikey: string;
}

interface InstanceData {
  id: string;
  name: string;
  token: string;
  connectionStatus: string;
}

interface InstanceValidationResponse {
  isValid: boolean;
  isGlobalKey: boolean;
  instance?: InstanceData;
  error?: string;
}

export const verifyInstanceKey = async ({ 
  url, 
  apikey 
}: VerifyInstanceKeyParams): Promise<InstanceValidationResponse> => {
  try {
    const urlFormatted = url.endsWith("/") ? url.slice(0, -1) : url;
    const { data } = await axios.get(
      `${urlFormatted}/instance/fetchInstances`,
      { headers: { apikey } }
    );

    // Validar resposta
    if (!data || !Array.isArray(data)) {
      return {
        isValid: false,
        isGlobalKey: false,
        error: "Invalid API response"
      };
    }

    // Nenhuma instância = Key inválida
    if (data.length === 0) {
      return {
        isValid: false,
        isGlobalKey: false,
        error: "No instance found with this key"
      };
    }

    // Múltiplas instâncias = Global Key
    if (data.length > 1) {
      return {
        isValid: false,
        isGlobalKey: true,
        error: "Global API Key detected"
      };
    }

    // Instância única = Sucesso!
    const instance = data[0];
    return {
      isValid: true,
      isGlobalKey: false,
      instance: {
        id: instance.id,
        name: instance.name,
        token: instance.token,
        connectionStatus: instance.connectionStatus
      }
    };

  } catch (error) {
    console.error("Error verifying instance key:", error);
    return {
      isValid: false,
      isGlobalKey: false,
      error: "Authentication failed"
    };
  }
};