export interface FlowPosition {
  x: number;
  y: number;
}

export interface FlowNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: FlowPosition;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface ConfigField {
  key: string;
  label: string;
  field_type: string;
  default?: unknown;
  options?: string[];
  required?: boolean;
  description?: string;
}

export interface ModuleDefinition {
  type_id: string;
  label: string;
  category: string;
  description: string;
  color: string;
  inputs: string[];
  outputs: string[];
  config_fields: ConfigField[];
}

export interface FlowTraceStep {
  node_id: string;
  type: string;
  output_handle: string;
  config: Record<string, unknown>;
}

export interface FlowExecuteResult {
  status: 'completed' | 'stopped' | 'error';
  data: Record<string, unknown>;
  logs: string[];
  trace: FlowTraceStep[];
  error?: string | null;
}

export interface FlowConfigurationSummary {
  id: string;
  name: string;
  description: string;
  owner_email?: string;
  created_at: string;
  updated_at: string;
}

export interface FlowConfiguration extends FlowConfigurationSummary {
  flow: FlowDefinition;
}

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  moduleType: string;
  config: Record<string, unknown>;
  color: string;
  inputs: string[];
  outputs: string[];
  configFields: ConfigField[];
  onChangeConfig?: (nodeId: string, config: Record<string, unknown>) => void;
}
