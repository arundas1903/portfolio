import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowNodeData } from '../../types/flow';

function FlowModuleNode({ data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;

  return (
    <div
      className={`fb-node${selected ? ' fb-node--selected' : ''}`}
      style={{ '--fb-node-color': nodeData.color } as React.CSSProperties}
    >
      <div className="fb-node__header">
        <span className="fb-node__dot" aria-hidden />
        <span className="fb-node__title">{nodeData.label}</span>
        <span className="fb-node__type ios26-caption2">{nodeData.moduleType}</span>
      </div>

      {nodeData.inputs.map((handleId) => (
        <Handle
          key={`in-${handleId}`}
          id={handleId}
          type="target"
          position={Position.Left}
          className="fb-handle fb-handle--in"
          title={handleId}
        />
      ))}

      {nodeData.outputs.map((handleId, index) => (
        <Handle
          key={`out-${handleId}`}
          id={handleId}
          type="source"
          position={Position.Right}
          className="fb-handle fb-handle--out"
          style={{ top: `${30 + index * 28}%` }}
          title={handleId}
        />
      ))}

      {nodeData.outputs.length > 1 && (
        <div className="fb-node__handles">
          {nodeData.outputs.map((handleId) => (
            <span key={handleId} className="ios26-caption2">
              {handleId}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(FlowModuleNode);
