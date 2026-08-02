import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import 'd3-transition';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SubpageNav from '../components/ios26/SubpageNav';
import Button from '../components/ios26/Button';
import FlowModuleNode from './components/nodes/FlowModuleNode';
import NodePalette from './components/NodePalette';
import NodeConfigPanel from './components/NodeConfigPanel';
import RunPanel from './components/RunPanel';
import {
  configurationRunUrl,
  createFlowConfiguration,
  executeFlow,
  executeSavedConfiguration,
  fetchFlowConfiguration,
  fetchFlowModules,
  updateFlowConfiguration,
} from './api/flowBuilder';
import { FLOW_BUILDER_AUTH_HEADERS } from './api/flowBuilderAuth';
import { hydrateFlowToCanvas, serializeFlow, createNodeFromModule } from './registry/nodeRegistry';
import { buildStarterFlow } from './registry/starterFlow';
import type { FlowExecuteResult, FlowNodeData, ModuleDefinition } from './types/flow';

const nodeTypes = { flowModule: FlowModuleNode };
const SAMPLE_INPUT = '{\n  "score": 72,\n  "customer": "Acme Corp"\n}';

export default function FlowBuilderEditorPage() {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const isNew = configId === 'new';

  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [savedConfigId, setSavedConfigId] = useState<string | null>(isNew ? null : configId ?? null);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node<FlowNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputJson, setInputJson] = useState(SAMPLE_INPUT);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<FlowExecuteResult | null>(null);
  const [runError, setRunError] = useState('');

  const currentFlow = useCallback(
    () =>
      serializeFlow(
        nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges,
      ),
    [nodes, edges],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const loadedModules = await fetchFlowModules();
        if (cancelled) return;
        setModules(loadedModules);

        if (isNew) {
          setConfigName('Untitled flow');
          setConfigDescription('');
          setSavedConfigId(null);
          const starter = buildStarterFlow(loadedModules);
          setNodes(starter.nodes);
          setEdges(starter.edges);
        } else if (configId) {
          const config = await fetchFlowConfiguration(configId);
          if (cancelled) return;
          const hydrated = hydrateFlowToCanvas(config.flow, loadedModules);
          setSavedConfigId(config.id);
          setConfigName(config.name);
          setConfigDescription(config.description);
          setNodes(hydrated.nodes);
          setEdges(hydrated.edges);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load configuration');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [configId, isNew, setNodes, setEdges]);

  const modulesByType = useMemo(
    () => Object.fromEntries(modules.map((module) => [module.type_id, module])),
    [modules],
  );

  const selectedNode = nodes.find((node) => node.id === selectedId);
  const selectedData = selectedNode?.data;

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  );

  const addModule = useCallback(
    (module: ModuleDefinition) => {
      const offset = nodes.length * 24;
      const newNode = createNodeFromModule(module, { x: 120 + offset, y: 120 + offset }, nodes.length);
      setNodes((current) => [...current, newNode]);
    },
    [nodes.length, setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const typeId = event.dataTransfer.getData('application/flow-module');
      const module = modulesByType[typeId];
      if (!module) return;

      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 80,
        y: event.clientY - bounds.top - 40,
      };
      const newNode = createNodeFromModule(module, position, nodes.length);
      setNodes((current) => [...current, newNode]);
    },
    [modulesByType, nodes.length, setNodes],
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, config } } : node,
        ),
      );
    },
    [setNodes],
  );

  const handleSave = async () => {
    if (!configName.trim()) {
      setSaveError('Name is required.');
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const flow = currentFlow();
      if (savedConfigId) {
        await updateFlowConfiguration(savedConfigId, {
          name: configName.trim(),
          description: configDescription.trim(),
          flow,
        });
      } else {
        const created = await createFlowConfiguration({
          name: configName.trim(),
          description: configDescription.trim(),
          flow,
        });
        setSavedConfigId(created.id);
        navigate(`/flow-builder/${created.id}`, { replace: true });
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunError('');
    setResult(null);

    let inputData: Record<string, unknown> = {};
    try {
      inputData = JSON.parse(inputJson || '{}') as Record<string, unknown>;
    } catch {
      setRunError('Input data must be valid JSON.');
      setRunning(false);
      return;
    }

    try {
      const response = savedConfigId
        ? await executeSavedConfiguration(savedConfigId, inputData)
        : await executeFlow(currentFlow(), inputData);
      setResult(response);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fb-page">
      <div className="fb-background" aria-hidden />

      <div className="fb-page__inner fb-page__inner--editor">
        <SubpageNav to="/flow-builder" label="Configurations" />

        <header className="fb-editor-meta ios26-liquid-glass-la glass-surface">
          <h1 className="ios26-title2">{isNew && !savedConfigId ? 'Create configuration' : 'Edit configuration'}</h1>

          <div className="fb-editor-meta__fields">
            <label className="fb-field">
              <span className="ios26-caption2 fb-muted">Name</span>
              <input
                className="fb-input ios26-body"
                type="text"
                value={configName}
                onChange={(event) => setConfigName(event.target.value)}
                placeholder="Approval workflow"
              />
            </label>
            <label className="fb-field">
              <span className="ios26-caption2 fb-muted">Description</span>
              <input
                className="fb-input ios26-body"
                type="text"
                value={configDescription}
                onChange={(event) => setConfigDescription(event.target.value)}
                placeholder="Optional summary"
              />
            </label>
          </div>

          {savedConfigId && (
            <div className="fb-editor-meta__api ios26-caption2">
              <span className="fb-muted">UUID:</span>{' '}
              <code className="fb-code-inline">{savedConfigId}</code>
              <span className="fb-muted">Headers:</span>{' '}
              <code className="fb-code-inline">{FLOW_BUILDER_AUTH_HEADERS.password}</code>,{' '}
              <code className="fb-code-inline">{FLOW_BUILDER_AUTH_HEADERS.email}</code>
              <span className="fb-muted">Run API:</span>{' '}
              <code className="fb-code-inline">POST {configurationRunUrl(savedConfigId)}</code>
            </div>
          )}
        </header>

        {loadError ? (
          <p className="fb-error ios26-footnote">{loadError}</p>
        ) : loading ? (
          <p className="ios26-footnote fb-muted">Loading editor…</p>
        ) : (
          <>
            <div className="fb-layout">
              <NodePalette modules={modules} onAdd={addModule} />

              <div
                className="fb-canvas-wrap ios26-liquid-glass-me glass-surface"
                onDrop={onDrop}
                onDragOver={onDragOver}
              >
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, node) => setSelectedId(node.id)}
                  onPaneClick={() => setSelectedId(null)}
                  nodeTypes={nodeTypes}
                  fitView
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={18} size={1} />
                  <Controls />
                  <MiniMap pannable zoomable />
                </ReactFlow>
              </div>

              <NodeConfigPanel
                nodeId={selectedId}
                label={selectedData?.label || ''}
                moduleType={selectedData?.moduleType || ''}
                config={selectedData?.config || {}}
                fields={selectedData?.configFields || []}
                onChange={updateNodeConfig}
              />
            </div>

            <RunPanel
              inputJson={inputJson}
              onInputChange={setInputJson}
              onRun={handleRun}
              running={running}
              result={result}
              error={runError}
              configId={savedConfigId}
            />
          </>
        )}

        <footer className="fb-save-bar ios26-liquid-glass-me glass-surface">
          {saveError && <p className="fb-error ios26-footnote">{saveError}</p>}
          <div className="fb-save-bar__actions">
            <Button variant="tinted" to="/flow-builder">
              Cancel
            </Button>
            <Button variant="filled" onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Saving…' : savedConfigId ? 'Save changes' : 'Save configuration'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
