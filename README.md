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
