import React from 'react';
import { Link } from 'react-router-dom';
import countriesData from '../a2p-atlas/data/countries.json';
import SubpageNav from '../components/ios26/SubpageNav';
import Button from '../components/ios26/Button';
import type { CountryRecord } from '../a2p-atlas/types';
import '../styles/a2p-regulatory-mcp.css';

const countries = countriesData as CountryRecord[];
const REGISTRATION_ALPHA = countries.filter((c) => c.channels.alphanumeric === 'registration').length;

const MCP_TOOLS = [
  {
    name: 'lookup_country',
    description: 'Full regulatory profile by ISO-2 code or country name.',
  },
  {
    name: 'search_countries',
    description: 'Filter markets by sender channel, support level, two-way SMS, or international sending.',
  },
  {
    name: 'list_registration_required',
    description: 'Countries where sender registration is mandatory.',
  },
  {
    name: 'get_onboarding_guidance',
    description: 'Step-by-step launch checklist for a country and channel.',
  },
  {
    name: 'compare_countries',
    description: 'Side-by-side regulatory comparison across multiple markets.',
  },
  {
    name: 'get_dataset_overview',
    description: 'High-level stats for the full dataset.',
  },
];

const CURSOR_CONFIG = `{
  "mcpServers": {
    "a2p-regulatory": {
      "command": "python3",
      "args": [
        "/ABSOLUTE/PATH/TO/portfolio/mcp/a2p-regulatory/a2p_regulatory/server.py"
      ],
      "env": {
        "A2P_DATA_PATH": "/ABSOLUTE/PATH/TO/portfolio/mcp/a2p-regulatory/data/countries.json"
      }
    }
  }
}`;

export default function A2PRegulatoryMcpPage() {
  return (
    <div className="a2p-mcp-page">
      <div className="a2p-mcp-background" aria-hidden />

      <div className="a2p-mcp-inner">
        <SubpageNav to="/" label="Portfolio" />

        <header className="a2p-mcp-hero ios26-liquid-glass-la glass-surface">
          <p className="a2p-mcp-eyebrow ios26-caption2">Model Context Protocol</p>
          <h1 className="ios26-large-title ios26-large-title--emphasized">
            A2P Regulatory Intelligence
          </h1>
          <p className="ios26-body a2p-mcp-lead">
            An MCP server that gives AI assistants structured access to global A2P SMS regulatory
            data — sender channel support, registration rules, and onboarding guidance across{' '}
            {countries.length}+ countries.
          </p>
          <div className="a2p-mcp-stats">
            <div className="a2p-mcp-stat">
              <span className="a2p-mcp-stat__value ios26-title2">{countries.length}</span>
              <span className="ios26-caption2">Countries</span>
            </div>
            <div className="a2p-mcp-stat">
              <span className="a2p-mcp-stat__value ios26-title2">6</span>
              <span className="ios26-caption2">MCP tools</span>
            </div>
            <div className="a2p-mcp-stat">
              <span className="a2p-mcp-stat__value ios26-title2">{REGISTRATION_ALPHA}</span>
              <span className="ios26-caption2">Alpha registration markets</span>
            </div>
          </div>
          <div className="a2p-mcp-actions">
            <Button variant="filled" to="/a2p-atlas">
              Open A2P Atlas
            </Button>
            <Button variant="tinted" to="/">
              Open portfolio chat
            </Button>
          </div>
        </header>

        <section className="a2p-mcp-section ios26-liquid-glass-me glass-surface">
          <h2 className="ios26-title2">What it does</h2>
          <p className="ios26-body a2p-mcp-copy">
            Product and solutions teams launching A2P SMS globally need quick answers: Is alphanumeric
            supported? Is registration required? What is the fallback channel? This MCP server exposes
            those answers as tools any MCP-compatible client — Cursor, Claude Desktop, or custom agents —
            can call during a conversation.
          </p>
          <p className="ios26-body a2p-mcp-copy">
            The same regulatory engine also powers the <strong>A2P Regulatory Intel</strong> assistant
            in the portfolio chat widget and the interactive{' '}
            <Link to="/a2p-atlas">A2P Atlas</Link> map.
          </p>
        </section>

        <section className="a2p-mcp-section ios26-liquid-glass-me glass-surface">
          <h2 className="ios26-title2">Tools</h2>
          <ul className="a2p-mcp-tools">
            {MCP_TOOLS.map((tool) => (
              <li key={tool.name} className="a2p-mcp-tool">
                <code className="a2p-mcp-tool__name">{tool.name}</code>
                <p className="ios26-footnote">{tool.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="a2p-mcp-section ios26-liquid-glass-me glass-surface">
          <h2 className="ios26-title2">Connect in Cursor</h2>
          <p className="ios26-body a2p-mcp-copy">
            Install MCP dependencies, then add the server to your Cursor MCP config. Replace the
            absolute paths with your local clone of this repository.
          </p>
          <pre className="a2p-mcp-code ios26-footnote">
            <code>{`cd mcp/a2p-regulatory
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[mcp]"`}</code>
          </pre>
          <p className="ios26-caption2 a2p-mcp-copy">
            Add to <code>~/.cursor/mcp.json</code> (or project MCP settings):
          </p>
          <pre className="a2p-mcp-code ios26-footnote">
            <code>{CURSOR_CONFIG}</code>
          </pre>
        </section>

        <section className="a2p-mcp-section ios26-liquid-glass-me glass-surface">
          <h2 className="ios26-title2">Example prompts</h2>
          <ul className="a2p-mcp-examples ios26-body">
            <li>Look up Germany and tell me if alphanumeric sender IDs need registration.</li>
            <li>Which countries require short-code registration?</li>
            <li>Give me an onboarding checklist for OTP traffic in India on long code.</li>
            <li>Compare A2P channel support in Brazil, Mexico, and Colombia.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
