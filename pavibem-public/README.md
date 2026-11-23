# Pavibem Public Guard — testes isolados e com dados fictícios

Este pacote contém **funções PHP específicas** copiadas do código da Cotativa e testadas no
`Cotativa/cotativa-overture-worker` (repositório público). Não inclui o sistema financeiro,
banco de dados, autenticação, empresas, fichas reais de funcionários, contatos, documentos,
imagens, chaves Pix ou credenciais.

## Cobertura pública

- `src/pavibem_pure.php`: snapshots de funções puras de valor decimal,
  data/competência, calendário de domingos e feriados e agrupamento de dias
  de pagamento por função
- `src/pavibem_reports.php`: snapshots dos geradores de relatório PDF e XLSX,
  sem integrações com banco ou dados reais
- `tests/pavibem_public_smoke.php`: regressão com **dados sintéticos** para
  mês bissexto, valores brasileiros, domingos/feriados, ausência e agrupamentos
- `tests/pavibem_report_smoke.php`: ficha de 80 profissionais fictícios,
  valida que relatório externo omite valores e interno os inclui
- `.github/workflows/pavibem-public-guard.yml`: execução PHP 8.5 em runner
  público, com artefatos apenas em arquivos temporários; nenhum PDF é publicado

## O que continua privado

O `cotativa-admin` possui vários módulos que não são independentes: importação
de fotos, deduplicação, IA de revisão, aprovação, reembolso e pagamento, controle
de acesso, banco de dados e integração com o Worker. Os testes completos continuam
em `.github/workflows/pavibem-guard.yml`, com execução **manual**.

**Esta suíte pública NÃO substitui os testes de integração privados.** Ela
não é disparada automaticamente por alterações do código privado: a versão
das funções copiadas precisa ser revisada e sincronizada ao alterar suas origens,
além de rodar lint/testes de integração na validação de release.

## Privacidade e custos

GitHub público recebe exclusivamente testes com pessoas fictícias,
e **não** recebe valores concretos de obras, documentos ou cadastros reais.
Os minutos desse workflow não consomem a franquia de computação de
Actions privada. O orçamento privado US$0 não precisa ser alterado.

## Uso operacional

`Pavibem Public Guard` é exclusivamente pipeline de desenvolvimento.
O módulo operacional continua na HostGator, dentro da Cotativa Admin;
nenhum processamento de funcionários passa a ocorrer no GitHub público.

Alterar `pavibem-public` não atualiza a Cotativa Admin. O deploy
continua controlado pelo repositório privado e pelo Deploy Center.
