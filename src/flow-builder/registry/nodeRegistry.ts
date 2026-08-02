import type { Edge, Node } from '@xyflow/react';
import type { FlowDefinition, FlowNodeData, ModuleDefinition } from '../types/flow';

/** Default config values for a module type. */
export function defaultConfig(module: ModuleDefinition): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const field of module.config_fields) {
    if (field.default !== undefined && field.default !== null) {
      config[field.key] = field.default;
    } else if (field.field_type === 'number') {
      config[field.key] = 0;
    } else if (field.field_type === 'boolean') {
      config[field.key] = false;
    } else {
      config[field.key] = '';
    }
  }
  return config;
}

/** Create a new canvas node from a module definition. */
export function createNodeFromModule(
  module: ModuleDefinition,
  position: { x: number; y: number },
  index: number,
): Node<FlowNodeData> {
  return {
    id: `${module.type_id}-${Date.now()}-${index}`,
    type: 'flowModule',
    position,
    data: {
      label: module.label,
      moduleType: module.type_id,
      config: defaultConfig(module),
      color: module.color,
      inputs: module.inputs,
      outputs: module.outputs,
      configFields: module.config_fields,
    },
  };
}

/** Restore React Flow canvas state from a saved flow definition. */
export function hydrateFlowToCanvas(
  flow: FlowDefinition,
  modules: ModuleDefinition[],
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const modulesByType = Object.fromEntries(modules.map((module) => [module.type_id, module]));

  const nodes: Node<FlowNodeData>[] = flow.nodes.map((node) => {
    const module = modulesByType[node.type];
    return {
      id: node.id,
      type: 'flowModule',
      position: node.position,
      data: {
        label: module?.label ?? node.type,
        moduleType: node.type,
        config: node.config,
        color: module?.color ?? '#6366f1',
        inputs: module?.inputs ?? ['in'],
        outputs: module?.outputs ?? ['out'],
        configFields: module?.config_fields ?? [],
      },
    };
  });

  const edges: Edge[] = flow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));

  return { nodes, edges };
}

/** Serialize React Flow state to backend flow definition. */
export function serializeFlow(
  nodes: Array<{ id: string; type?: string; position: { x: number; y: number }; data: { moduleType: string; config: Record<string, unknown> } }>,
  edges: Array<{ id: string; source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }>,
) {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.data.moduleType,
      config: node.data.config,
      position: node.position,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'out',
      targetHandle: edge.targetHandle || 'in',
    })),
  };
}

/**
 * To add a new frontend node type:
 * 1. Ensure the backend module is registered in flow_builder/modules/
 * 2. Optionally add custom UI in components/nodes/ and register below
 * 3. Modules fetched from /api/flow-builder/modules appear in the palette automatically
 */
export const NODE_TYPE = 'flowModule';
