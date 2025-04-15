# ClickUp MCP Server

Een Model Context Protocol (MCP) server voor ClickUp integratie, waarmee AI-assistenten zoals Claude kunnen communiceren met ClickUp.

## Functionaliteiten

Deze MCP server biedt de volgende tools voor interactie met ClickUp:

- **Tasks**: Ophalen, aanmaken en bijwerken van taken
- **Lists**: Ophalen van lijsten en hun statussen
- **Attachments**: Uploaden en downloaden van bijlagen bij taken
- **Comments**: Ophalen van opmerkingen bij taken

## Vereisten

- Node.js 18 of hoger
- Een ClickUp account met een API token
- Docker en Docker Compose (voor containerisatie)

## ClickUp API Token verkrijgen

Om deze MCP server te gebruiken, heb je een ClickUp API token nodig. Volg deze stappen om een token te verkrijgen:

1. Log in op je ClickUp account
2. Klik op je avatar in de rechterbovenhoek
3. Selecteer "Settings"
4. Klik op "Apps" in de zijbalk
5. Onder "API Token", klik op "Generate" of "Regenerate"
6. Kopieer de token en bewaar deze veilig

## Workspace ID vinden

Om je Workspace ID te vinden, kun je een van de volgende methoden gebruiken:

1. **Via de URL**: Open ClickUp in je browser en kijk naar de URL. Het zal er ongeveer zo uitzien: `https://app.clickup.com/WORKSPACE_ID/v/l/li/LIST_ID`. Het nummer na `app.clickup.com/` is je Workspace ID.

2. **Via de API**: Gebruik de `get-workspaces` tool van deze MCP server om alle workspaces op te halen.

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

### Optie 1: Docker (aanbevolen)

De eenvoudigste manier om de server te gebruiken is via Docker. De Docker image wordt automatisch gebouwd en gepubliceerd naar GitHub Container Registry.

```bash
# Pull de image
docker pull ghcr.io/bravoure/clickup-mcp:latest

# Start de container met je ClickUp API token
docker run -d \
  -e CLICKUP_API_TOKEN=your_api_token_here \
  -e DEFAULT_WORKSPACE_ID=your_workspace_id_here \
  --name clickup-mcp \
  ghcr.io/bravoure/clickup-mcp:latest
```

### Optie 2: Lokaal draaien

Als je de server lokaal wilt draaien, volg dan deze stappen:

```bash
# Clone de repository
git clone https://github.com/bravoure/clickup-mcp.git
cd clickup-mcp

# Installeer dependencies
npm install

# Maak een .env bestand aan met je ClickUp API token
echo "CLICKUP_API_TOKEN=your_api_token_here" > .env
echo "DEFAULT_WORKSPACE_ID=your_workspace_id_here" >> .env

# Start de server
npm start
```

### Optie 3: Docker Compose

Je kunt ook Docker Compose gebruiken om de container te starten:

```bash
# Clone de repository
git clone https://github.com/bravoure/clickup-mcp.git
cd clickup-mcp

# Maak een .env bestand aan met je ClickUp API token
echo "CLICKUP_API_TOKEN=your_api_token_here" > .env
echo "DEFAULT_WORKSPACE_ID=your_workspace_id_here" >> .env

# Start de container
docker-compose up -d
```

## Integratie met AI-assistenten

### Integratie met Claude Desktop

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
        "ghcr.io/bravoure/clickup-mcp:latest"
      ]
    }
  }
}
```

4. Herstart Claude Desktop

### Integratie met Augment

Om deze MCP server te gebruiken met Augment in VS Code:

1. Open VS Code
2. Druk op Cmd/Ctrl+Shift+P
3. Typ "Augment: Edit Settings"
4. Klik op "Edit in settings.json"
5. Voeg de volgende configuratie toe:

```json
"augment.advanced": {
    "mcpServers": [
        {
            "name": "clickup",
            "command": "docker",
            "args": [
                "run",
                "--rm",
                "-e", "CLICKUP_API_TOKEN=your_api_token_here",
                "-e", "DEFAULT_WORKSPACE_ID=your_workspace_id_here",
                "ghcr.io/bravoure/clickup-mcp:latest"
            ]
        }
    ]
}
```

6. Sla de wijzigingen op en herstart VS Code

## Beschikbare Tools

| Tool | Beschrijving |
|------|-------------|
| get-task | Haal een specifieke taak op via ID (inclusief comments en bijlagen) |
| create-task | Maak een nieuwe taak aan in een lijst |
| update-task | Werk een bestaande taak bij (inclusief status wijzigen) |
| get-lists | Haal alle lijsten in een folder op |
| get-folderless-lists | Haal alle lijsten op die niet in een folder zitten |
| get-list-statuses | Haal alle statussen van een lijst op |
| create-task-attachment | Upload een bijlage naar een taak |
| download-task-attachments | Download alle bijlagen van een taak |
| get-task-comments | Haal alle opmerkingen van een taak op |

## Licentie

MIT
