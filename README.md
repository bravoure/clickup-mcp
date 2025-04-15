# ClickUp MCP Server

Een Model Context Protocol (MCP) server voor ClickUp integratie, waarmee AI-assistenten zoals Claude kunnen communiceren met ClickUp.

## Functionaliteiten

Deze MCP server biedt de volgende tools voor interactie met ClickUp:

- **Tasks**: Ophalen van specifieke taken via task ID
- **Attachments**: Uploaden en downloaden van bijlagen bij taken
- **Comments**: Ophalen van opmerkingen bij taken

## Vereisten

- Node.js 18 of hoger
- Een ClickUp account met een API token
- Docker en Docker Compose (voor containerisatie)

## Installatie

1. Clone deze repository:
   ```
   git clone <repository-url>
   cd clickup-mcp-server
   ```

2. Installeer de dependencies:
   ```
   npm install
   ```

3. Maak een `.env` bestand aan op basis van het `.env.example` bestand:
   ```
   cp .env.example .env
   ```

4. Vul je ClickUp API token in het `.env` bestand in:
   ```
   CLICKUP_API_TOKEN=your_api_token_here
   DEFAULT_WORKSPACE_ID=your_default_workspace_id_here
   ```

## Gebruik

### Lokaal draaien

Start de server lokaal:

```
npm start
```

### Docker

Bouw en start de Docker container:

```
docker-compose up -d
```

## Integratie met Claude Desktop

Om deze MCP server te gebruiken met Claude Desktop:

1. Zorg ervoor dat je Claude Desktop hebt geïnstalleerd
2. Open het configuratiebestand op `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Voeg de volgende configuratie toe:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-e",
        "CLICKUP_API_TOKEN=your_api_token_here",
        "-e",
        "DEFAULT_WORKSPACE_ID=your_default_workspace_id_here",
        "clickup-mcp-server"
      ]
    }
  }
}
```

4. Herstart Claude Desktop

## Beschikbare Tools

| Tool | Beschrijving |
|------|-------------|
| get-task | Haal een specifieke taak op via ID |
| create-task-attachment | Upload een bijlage naar een taak |
| download-task-attachments | Download alle bijlagen van een taak |
| get-task-comments | Haal alle opmerkingen van een taak op |

## Licentie

MIT
