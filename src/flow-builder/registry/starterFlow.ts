import type { Edge, Node } from '@xyflow/react';
import type { FlowNodeData, ModuleDefinition } from '../types/flow';
import { createNodeFromModule } from './nodeRegistry';

export function buildStarterFlow(modules: ModuleDefinition[]): {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} {
  const byType = Object.fromEntries(modules.map((module) => [module.type_id, module]));
  const start = byType.start;
  const condition = byType.condition;
  const setApproved = byType.set_value;
  const setRejected = byType.set_value;
  const end = byType.end;

  if (!start || !condition || !setApproved || !setRejected || !end) {
    return { nodes: [], edges: [] };
  }

  const approvedConfig = { key: 'status', value: 'approved' };
  const rejectedConfig = { key: 'status', value: 'rejected' };

  const nodes: Node<FlowNodeData>[] = [
    { ...createNodeFromModule(start, { x: 80, y: 180 }, 1), id: 'start-1' },
    {
      ...createNodeFromModule(condition, { x: 320, y: 160 }, 2),
      id: 'cond-1',
      data: {
        ...createNodeFromModule(condition, { x: 0, y: 0 }, 0).data,
        config: { field: 'score', operator: 'gte', value: '70' },
      },
    },
    {
      ...createNodeFromModule(setApproved, { x: 580, y: 80 }, 3),
      id: 'set-approved',
      data: {
        ...createNodeFromModule(setApproved, { x: 0, y: 0 }, 0).data,
        config: approvedConfig,
      },
    },
    {
      ...createNodeFromModule(setRejected, { x: 580, y: 260 }, 4),
      id: 'set-rejected',
      data: {
        ...createNodeFromModule(setRejected, { x: 0, y: 0 }, 0).data,
        config: rejectedConfig,
      },
    },
    { ...createNodeFromModule(end, { x: 840, y: 180 }, 5), id: 'end-1' },
  ];

  const edges: Edge[] = [
    { id: 'e1', source: 'start-1', target: 'cond-1', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'e2', source: 'cond-1', target: 'set-approved', sourceHandle: 'yes', targetHandle: 'in' },
    { id: 'e3', source: 'cond-1', target: 'set-rejected', sourceHandle: 'no', targetHandle: 'in' },
    { id: 'e4', source: 'set-approved', target: 'end-1', sourceHandle: 'out', targetHandle: 'in' },
    { id: 'e5', source: 'set-rejected', target: 'end-1', sourceHandle: 'out', targetHandle: 'in' },
  ];

  return { nodes, edges };
}
