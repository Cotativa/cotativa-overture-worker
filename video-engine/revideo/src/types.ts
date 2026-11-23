export type CotativaVideoScene = {
  kind?: string;
  label?: string;
  eyebrow?: string;
  headline?: string;
  body?: string;
  accent?: string;
  icon?: string;
  director?: string;
  motion_direction?: {
    composition?: string;
    entrance?: string;
    action?: string;
    bridge?: string;
    camera?: string;
    timeline?: string;
    continuity_token?: string;
  };
};

export type CotativaVideoBrief = {
  schema?: number;
  style?: string;
  creative_style?: string;
  icon_library?: string;
  slug?: string;
  request_id?: string;
  fps?: number;
  seconds_per_scene?: number;
  transition_seconds?: number;
  motion_director?: string;
  legacy_director?: string;
  fallback_mode?: string;
  watermark?: {
    enabled?: boolean;
    mode?: 'off' | 'subtle' | 'medium' | 'brand_heavy' | string;
    variant?: 'auto' | 'full_logo' | 'symbol' | 'wordmark' | string;
    position?: string;
    version?: string;
    asset?: string;
  };
  brand?: {
    name?: string;
    site?: string;
    tagline?: string;
    navy?: string;
    navy_2?: string;
    blue?: string;
    green?: string;
    white?: string;
  };
  scenes?: CotativaVideoScene[];
};

export const fallbackBrief: CotativaVideoBrief = {
  schema: 4,
  style: 'revideo_enterprise_v1',
  creative_style: 'enterprise_glow',
  icon_library: 'tabler',
  slug: 'cotativa',
  request_id: 'preview',
  fps: 30,
  seconds_per_scene: 3.15,
  transition_seconds: 0.48,
  watermark: {
    enabled: true,
    mode: 'subtle',
    variant: 'full_logo',
    position: 'center',
    version: 'watermark-1',
    asset: '/brand/cotativa-horizontal-claro.webp'
  },
  brand: {
    name: 'COTATIVA',
    site: 'cotativa.com',
    tagline: 'TECNOLOGIA PARA NEGÓCIOS',
    navy: '071520',
    navy_2: '0A2233',
    blue: '2E6D98',
    green: '4EDC84',
    white: 'F7FAFB'
  },
  scenes: [
    {
      label: 'ABERTURA',
      eyebrow: 'RADAR COTATIVA',
      headline: 'Presença digital precisa gerar movimento',
      body: 'Estratégia, tecnologia e aquisição trabalhando juntas.',
      accent: 'CRESCIMENTO',
      icon: 'world-www'
    },
    {
      label: 'PROBLEMA',
      eyebrow: 'DIAGNÓSTICO',
      headline: 'Visibilidade sem jornada não vira oportunidade',
      body: 'Cada ponto de contato precisa conduzir o cliente para a próxima ação.',
      accent: 'JORNADA',
      icon: 'search'
    },
    {
      label: 'SINAL',
      eyebrow: 'INTELIGÊNCIA',
      headline: 'Dados mostram onde a conversão está escapando',
      body: 'Busca, site, conteúdo e contato precisam conversar entre si.',
      accent: 'DADOS',
      icon: 'chart-bar'
    },
    {
      label: 'SOLUÇÃO',
      eyebrow: 'ESTRUTURA',
      headline: 'Uma operação digital integrada muda o resultado',
      body: 'SEO, mídia, experiência e WhatsApp conectados em uma mesma estratégia.',
      accent: 'SISTEMA',
      icon: 'target-arrow'
    },
    {
      label: 'COTATIVA',
      eyebrow: 'TECNOLOGIA PARA NEGÓCIOS',
      headline: 'Transforme presença digital em oportunidade real',
      body: 'Estrutura digital para empresas que querem crescer.',
      accent: 'COTATIVA',
      icon: 'brand-whatsapp'
    }
  ]
};
