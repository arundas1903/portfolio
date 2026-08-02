# Flow Builder (frontend)

Visual workflow editor at `/flow-builder`.

## Structure

```
src/flow-builder/
  FlowBuilderPage.tsx      # Main page
  api/flowBuilder.ts       # Backend API client
  types/flow.ts            # Shared types
  registry/nodeRegistry.ts # Node factory + serialization
  components/
    NodePalette.tsx        # Draggable module list
    NodeConfigPanel.tsx    # Selected node inspector
    RunPanel.tsx           # Execute + results
    nodes/FlowModuleNode.tsx
  styles/flow-builder.css
```

## Adding a new component

1. Register the backend module in `backend/flow_builder/modules/`
2. Reload the page — modules are fetched from `GET /api/flow-builder/modules`
3. Optionally customize UI in `components/nodes/` if the generic node is not enough

The palette and inspector are driven entirely by the backend module definition (`config_fields`, `inputs`, `outputs`, `color`).
