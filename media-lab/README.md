# Cotativa Media Lab — desenvolvimento público de imagem e vídeo

## Finalidade

Biblioteca de desenvolvimento, testes de software e prévias **fictícias** de
composição visual. Usa runners padrão do GitHub Actions no repositório
**público** `Cotativa/cotativa-overture-worker`.

### Código publicado neste módulo
- `video-engine/hyperframes/`: snapshot do motor de composição HyperFrames do projeto
  (fonte e registries, sem os criativos ou tokens de clientes).
- `video-engine/revideo/`: código-fonte do renderizador Revideo.
- `media-lab/image_composer.py`: compositor gráfico offline e independente para
  imagens de demonstração; **não é um modelo de geração por IA**.
- `.github/workflows/media-lab-ci.yml`: testes de sintaxe e composição de
  imagem e MP4 de 2 segundos com dados fictícios.

O CI **não executa pedidos de clientes**, não faz download de briefs assinados,
não liga para o backend da Cotativa, não usa APIs de geração de imagens e não
envia artefatos produzidos. Apenas confirma que o motor está funcional
para desenvolvimento.

### Produção e separação de responsabilidade

O `cotativa-admin` mantém controle de usuários, assinaturas, aprovação,
publicações Meta, chamadas aos provedores de geração de imagens
(Cloudflare/Pollinations/Hugging Face) e armazenamento privado de mídia.

Os workflows públicos de desenvolvimento não são uma API ou infraestrutura
de renderização para o SaaS. O uso de GitHub Actions como serviço de
processamento comercial continuado pode contrariar os limites da plataforma:
https://docs.github.com/pt/site-policy/github-terms/github-terms-for-additional-products-and-features

Para produção, adaptar o motor a um **worker próprio** (container com Node,
FFmpeg e execução isolada) com API autenticada, filas, limites, logs,
consentimento, isolamento entre empresas, revisão de conteúdo e retenção curta.
As imagens por IA continuam a depender das cotas/termos dos provedores.

### Escopo de publicação dos arquivos

Qualquer pessoa pode ler o código deste repositório público. Não publicar
segredos, assinaturas, briefs comerciais reais, imagens do cliente, arquivos
de entrada privados ou resultados confidenciais neste repositório.

### Artefatos da prova de conceito

O CI confirma a criação de PNG e MP4 sintéticos, sem upload de arquivos.
Nada é transferido para o Deploy Center nem para a HostGator nesta fase.

### Sincronização

O código de motores neste repositório é uma cópia inicial. Até existir um
processo de sincronização, alterações na versão privada do Admin podem
não aparecer automaticamente aqui. Não considerar a cópia pública como
substituta imediata da integração de produção.
