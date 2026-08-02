import type {
  FlowConfiguration,
  FlowConfigurationSummary,
  FlowDefinition,
  FlowExecuteResult,
  FlowRunHistoryEntry,
  ModuleDefinition,
} from '../types/flow';
import { API_BASE } from '../../api/chatAuth';
import { flowBuilderAuthHeaders } from './flowBuilderAuth';

function jsonHeaders(): Record<string, string> {
  return flowBuilderAuthHeaders({ 'Content-Type': 'application/json' });
}

export async function fetchFlowModules(): Promise<ModuleDefinition[]> {
  const response = await fetch(`${API_BASE}/api/flow-builder/modules`, {
    headers: flowBuilderAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load flow modules');
  }
  return response.json();
}

export async function fetchFlowConfigurations(): Promise<FlowConfigurationSummary[]> {
  const response = await fetch(`${API_BASE}/api/flow-builder/configurations`, {
    headers: flowBuilderAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load configurations');
  }
  return response.json();
}

export async function fetchFlowConfiguration(id: string): Promise<FlowConfiguration> {
  const response = await fetch(`${API_BASE}/api/flow-builder/configurations/${id}`, {
    headers: flowBuilderAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Configuration not found');
  }
  return response.json();
}

export async function createFlowConfiguration(payload: {
  name: string;
  description?: string;
  flow: FlowDefinition;
}): Promise<FlowConfiguration> {
  const response = await fetch(`${API_BASE}/api/flow-builder/configurations`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not create configuration');
  }
  return data;
}

export async function updateFlowConfiguration(
  id: string,
  payload: { name?: string; description?: string; flow?: FlowDefinition },
): Promise<FlowConfiguration> {
  const response = await fetch(`${API_BASE}/api/flow-builder/configurations/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not update configuration');
  }
  return data;
}

export async function deleteFlowConfiguration(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/flow-builder/configurations/${id}`, {
    method: 'DELETE',
    headers: flowBuilderAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not delete configuration');
  }
}

export async function executeFlow(
  flow: FlowDefinition,
  inputData: Record<string, unknown> = {},
): Promise<FlowExecuteResult> {
  const response = await fetch(`${API_BASE}/api/flow-builder/execute`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ flow, input_data: inputData }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Flow execution failed');
  }

  return payload as FlowExecuteResult;
}

export async function executeSavedConfiguration(
  configId: string,
  inputData: Record<string, unknown> = {},
): Promise<FlowExecuteResult> {
  const response = await fetch(`${API_BASE}/api/flow-builder/run/${configId}`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(inputData),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Flow execution failed');
  }

  return payload as FlowExecuteResult;
}

export async function fetchConfigurationHistory(configId: string): Promise<FlowRunHistoryEntry[]> {
  const response = await fetch(`${API_BASE}/api/flow-builder/configurations/${configId}/history`, {
    headers: flowBuilderAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Could not load run history');
  }
  return response.json();
}

export async function pollWebhookWait(token: string): Promise<FlowExecuteResult> {
  const response = await fetch(`${API_BASE}/api/flow-builder/webhook/${token}/status`, {
    headers: flowBuilderAuthHeaders(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.detail;
    throw new Error(typeof detail === 'string' ? detail : 'Could not poll webhook wait');
  }

  return payload as FlowExecuteResult;
}

export function configurationRunUrl(configId: string): string {
  return `${API_BASE}/api/flow-builder/run/${configId}`;
}

export function getFlowBuilderApiDocsUrl(): string {
  return `${API_BASE}/docs#/flow-builder`;
}
