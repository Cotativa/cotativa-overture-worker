# Cotativa Overture Worker

Worker público e isolado usado pelo Prospector da Cotativa para consultas no dataset aberto **Overture Places**.

## O que existe neste repositório

- `scripts/prospector_overture.py`: consulta empresas no Overture Places por segmento, coordenadas e raio.
- `.github/workflows/prospector-overture.yml`: executa a consulta sob demanda e publica o resultado como artifact temporário.

## Segurança

Este repositório **não contém** código do painel administrativo da Cotativa, banco de dados, dados de clientes, leads, tokens, chaves, senhas ou outras credenciais.

O painel privado apenas dispara o workflow com os parâmetros necessários para a busca e recupera o artifact gerado.

## Artifacts

Os resultados são temporários e usam retenção de **1 dia**.

## SiteOne — migração segura (piloto)

O SiteOne também está sendo separado do painel privado, por etapas:

- `.github/workflows/siteone-public-smoke.yml`: prova de conceito sem tokens, concluída com sucesso.
- `.github/workflows/siteone-owner-site.yml`: auditoria **somente** de `https://cotativa.com/`. Não recebe URLs de clientes, IDs de prospecção, callbacks nem tokens. Executa `scripts/siteone_public_summary.py` para publicar apenas indicadores técnicos agregados; o relatório bruto é descartado no runner e não é enviado para o GitHub Artifacts.
- `tests/test_siteone_public_summary.py`: confirma que URLs individuais, segredos e campos extras não entram na saída.

**Limitação importante:** isso não migra a fila de scans de clientes do Admin. No repositório privado, `site-intelligence.yml` usa `callback_token` e produz artefatos de visitas a sites de empresas; copiar esse workflow para este repositório público revelaria dados de operação em metadados, logs ou downloads.

**Próxima fase:** desenhar uma interface de processamento com autorização, isolamento por cliente e controles de confidencialidade. Até lá, **não** apontar o Site Intelligence do painel para este workflow público, mesmo que o runner esteja funcionando.

Toda execução, inclusive os logs de tarefas públicas, pode ser vista por terceiros. Não cadastrar senhas, URLs assinadas nem dados pessoais nos inputs.
