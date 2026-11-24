# DOT Office — projeto visual público

**Versão:** 4.29.48 — Premium Diorama (14 agentes)  
**Origem:** `Cotativa/cotativa-admin`, branch `feature/dot-office-premium-diorama`, PR #298  
**Pasta:** `dot-office/`

Este diretório contém o **projeto visual do Dot Office**: o escritório 3D em miniatura, os agentes gráficos, planejamento espacial, animações, histórico dos motores visuais, uma demonstração fictícia independente, e testes automatizados. O projeto principal da Cotativa permanece privado.

## Estrutura

- `assets/dot-office-engine3.js` — renderizador oficial Three.js, câmera isométrica, personagens 3D procedurais, interface interativa.
- `assets/dot-office-engine3-plan.js` — planta física, setores, 14 postos, móveis e circulação.
- `assets/dot-office-engine3-behavior.js` — sincronização dos estados, atribuições visuais, deslocamento, sentar e trabalhar.
- `assets/dot-office-bootstrap.js` — inicialização e fallback.
- `assets/dot-office-*.js` — motores visuais e simulação anteriores, conservados para referência/compatibilidade. **Não integram a renderização oficial da versão 3.**
- `demo/` — ambiente independente usando **apenas dados sintéticos**. Nenhuma chamada ao painel privado.
- `tests/` — regressões de planta, estados, isolamento e verificação de fonte.
- `php/visual-contract.php` — contrato PHP público e **isolado**, somente para demonstrar e validar snapshots visuais fictícios.
- `tests/php-visual-contract-smoke.php` — testes em PHP 8.5 do contrato sintético e da codificação JSON segura contra XSS; **não** valida os arquivos PHP privados do painel.
- `THIRD_PARTY_NOTICES.txt` — atribuições e licenças das dependências e referências.
- `.github/workflows/dot-office-public-ci.yml` (raiz do repositório) — lint, testes e smoke do projeto público.

## Executar localmente

```bash
cd dot-office
npm run verify
python3 -m http.server 8080
```

Abrir `http://localhost:8080/demo/` (servidor iniciado dentro de `dot-office`). É necessário acesso à CDN pública do Three.js indicada no importmap da demonstração. O render ocorre no navegador; **não gera vídeo e não consome minutos de GitHub Actions para animar agentes**.

## Integração com a Cotativa privada

O navegador recebe um **snapshot de exibição, autorizado e minimizado** pela aplicação privada. `window.DotOfficeEngine.updateSnapshot(snapshot)` aplica o estado. Os principais campos públicos do contrato visual são:

```json
{
  "office": {"future_staffing": [{"id":"dot-manager","station":"manager","enabled":true,"meta":{"seat_index":0}}]},
  "agents": [{"id":"dot-manager","station":"manager","enabled":true,"current_job_id":0}],
  "stations": [{"key":"manager","label":"Gerência","status":"monitoring","metrics":[]}],
  "metrics": {"done_24h":0,"processing_agents":0,"success_24h":0},
  "task_board": []
}
```

A Cotativa é a autoridade sobre identidades, permissões, estado, aprovação, jobs e custo. O escritório apenas **apresenta** dados e dispara eventos de UI `dot:station-click` e `dot:navmesh-change`. Nunca envia comandos administrativos diretamente por este pacote público. Os endpoints `/admin/api/dot.php`, código `admin/app/dot_agent.php` e `admin/app/dot_dispatcher.php` **não fazem parte do pacote visual**, pois acessam o backend e o banco de dados e devem permanecer na aplicação privada.

As versões de código copiadas para cá precisam ser sincronizadas por release controlada com a versão do Admin. **Não habilitar a CDN pública no painel antes de passar os testes, revisar o conteúdo e fixar um commit/versão imutável.** A integração privada é responsabilidade do Deploy Center, com rollback.

## Segurança

Todos os dados e interações da demo são fictícios. Não publicar logs privados, clientes, tokens, URLs assinadas, arquivos do banco ou resultados comerciais. O pacote não inclui credenciais nem acesso ao backend. O projeto público expõe seu **código-fonte**; isso não equivale, por si só, a conceder uma licença geral de redistribuição. As licenças de terceiros constam de `THIRD_PARTY_NOTICES.txt`.

## Limite do PHP Lint público

O workflow público usa PHP 8.5 para testar **apenas** `php/visual-contract.php` e seu teste sintético. Esse lint nunca recebe `admin/app/dot_agent.php`, `admin/app/core.php`, tokens ou configurações reais.

Os arquivos privados são validados **no ambiente privado** pelo Deploy Center da Cotativa, que baixa os arquivos para staging, verifica hashes e usa `token_get_all(TOKEN_PARSE)` do PHP de produção antes de aplicar qualquer alteração. O lint CLI é uma confirmação complementar. Portanto, **uma execução verde aqui não substitui o lint do release privado**.

Para preservar a segurança do painel autenticado, a versão privada **não deve executar diretamente scripts de CDN ou GitHub**: deve servir arquivos JS já revisados e espelhados em `/admin/assets/` no mesmo domínio.

## GitHub Actions

O workflow público destina-se a **build, lint e testes do código liberado**. Não processa vídeos comerciais, não executa pesquisas de clientes, não recebe segredos, não recupera dados privados e não tenta contornar os termos de uso do GitHub Actions.

## Validação antes de produção

1. Passar no CI público e executar inspeção WebGL visual real em desktop e mobile.
2. Verificar os 14 agentes e suas mesas, incluindo falhas e ausência de tarefas reais.
3. Revisar responsividade, acessibilidade e desempenho, e registrar screenshots da demo **somente com dados sintéticos**.
4. Fazer o cutover através do Deploy Center com assets versionados e rollback confirmado.

**Status:** pacote público de desenvolvimento; publicação/integração em produção só depois da aprovação visual.
