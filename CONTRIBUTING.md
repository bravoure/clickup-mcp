# Bijdragen aan ClickUp MCP Server

Bedankt voor je interesse in het bijdragen aan de ClickUp MCP Server! Hier zijn enkele richtlijnen om je te helpen.

## Ontwikkelomgeving opzetten

1. Clone de repository:
   ```bash
   git clone https://github.com/bravoure/clickup-mcp.git
   cd clickup-mcp
   ```

2. Installeer dependencies:
   ```bash
   npm install
   ```

3. Maak een `.env` bestand aan met je ClickUp API token:
   ```bash
   echo "CLICKUP_API_TOKEN=your_api_token_here" > .env
   echo "DEFAULT_WORKSPACE_ID=your_workspace_id_here" >> .env
   ```

4. Start de server in development mode:
   ```bash
   npm run dev
   ```

## GitHub Actions Workflow

Deze repository gebruikt GitHub Actions om automatisch een Docker image te bouwen en naar GitHub Container Registry (GHCR) te pushen wanneer er wijzigingen worden gepusht naar de main branch.

### Workflow instellen

Om de GitHub Actions workflow correct te laten werken, moet je de volgende stappen uitvoeren:

1. Zorg ervoor dat je repository toegang heeft tot GitHub Packages. Ga naar de repository settings > Actions > General en zorg ervoor dat "Read and write permissions" is ingeschakeld onder "Workflow permissions".

2. Zorg ervoor dat de GitHub Container Registry is ingeschakeld voor je account of organisatie.

### Handmatig triggeren

Je kunt de workflow handmatig triggeren via de GitHub UI:

1. Ga naar de "Actions" tab in je repository
2. Selecteer de "Build and Push Docker Image" workflow
3. Klik op "Run workflow"
4. Selecteer de branch en klik op "Run workflow"

## Pull Requests

1. Fork de repository
2. Maak een nieuwe branch voor je feature of bugfix
3. Commit je wijzigingen
4. Push naar je fork
5. Maak een Pull Request

## Codestijl

- Gebruik ES modules (import/export)
- Gebruik async/await voor asynchrone code
- Voeg commentaar toe aan je code
- Houd functies klein en gefocust

## Testen

Voordat je een Pull Request maakt, test je wijzigingen door:

1. De server lokaal te draaien
2. De nieuwe functionaliteit te testen met een AI-assistent zoals Claude of Augment
3. Zorg ervoor dat alle bestaande functionaliteit blijft werken

## Nieuwe functionaliteit toevoegen

Als je nieuwe functionaliteit wilt toevoegen:

1. Voeg de methode toe aan de `ClickUpClient` class
2. Voeg de tool toe aan de MCP server
3. Voeg de handler toe voor de nieuwe tool
4. Update de README.md om de nieuwe functionaliteit te documenteren

## Vragen?

Als je vragen hebt, open dan een issue in de repository.
