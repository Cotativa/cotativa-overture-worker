import {
  Circle,
  Img,
  Node,
  Rect,
  Txt,
  blur,
  makeScene2D,
} from '@revideo/2d';
import {
  all,
  cancel,
  easeInOutCubic,
  easeOutCubic,
  loop,
  useScene,
  waitFor,
} from '@revideo/core';
import type {CotativaVideoBrief, CotativaVideoScene} from '../types.js';
import {fallbackBrief} from '../types.js';

const FONT = 'Arial, Helvetica, sans-serif';
const WHITE = '#F7FAFB';
const MUTED = '#AFC2CE';
const GREEN = '#4EDC84';
const CYAN = '#48B2D2';
const BLUE = '#2E6D98';
const VIOLET = '#6C5CE7';
const NAVY = '#071520';
const NAVY2 = '#0A2233';

function safeScene(input: CotativaVideoScene | undefined, index: number): Required<CotativaVideoScene> {
  const fallback = fallbackBrief.scenes?.[index % (fallbackBrief.scenes?.length || 1)] ?? {};
  return {
    kind: String(input?.kind || fallback.kind || 'insight'),
    label: String(input?.label || fallback.label || 'RADAR'),
    eyebrow: String(input?.eyebrow || fallback.eyebrow || 'RADAR COTATIVA'),
    headline: String(input?.headline || fallback.headline || 'Tecnologia para negócios'),
    body: String(input?.body || fallback.body || 'Estrutura digital para crescer.'),
    accent: String(input?.accent || fallback.accent || 'COTATIVA'),
    icon: String(input?.icon || fallback.icon || 'world-www'),
    director: String(input?.director || fallback.director || 'revideo_fallback'),
    motion_direction: input?.motion_direction || fallback.motion_direction || {},
  };
}

function styleAccent(style: string): string {
  if (style === 'poster_glow') return VIOLET;
  if (style === 'performance_ad') return GREEN;
  if (style === 'ui_mockup_flow') return CYAN;
  return BLUE;
}

function makeTxt(props: ConstructorParameters<typeof Txt>[0]): Txt {
  return new Txt({fontFamily: FONT, ...props});
}

function metricCard(label: string, number: string, x: number, active: boolean, accent: string): Rect {
  const card = new Rect({
    width: 240,
    height: 150,
    x,
    y: 360,
    radius: 28,
    smoothCorners: true,
    fill: 'rgba(255,255,255,0.045)',
    stroke: active ? 'rgba(78,220,132,0.38)' : 'rgba(255,255,255,0.08)',
    lineWidth: 2,
  });
  card.add(makeTxt({
    text: number,
    y: -40,
    fill: active ? GREEN : CYAN,
    fontWeight: 800,
    fontSize: 18,
  }));
  card.add(makeTxt({
    text: label,
    y: 13,
    fill: WHITE,
    opacity: 0.92,
    fontWeight: 700,
    fontSize: 17,
  }));
  const rail = new Rect({
    width: 160,
    height: 7,
    y: 48,
    radius: 4,
    fill: 'rgba(255,255,255,0.08)',
  });
  rail.add(new Rect({
    width: active ? 138 : 102,
    height: 7,
    x: active ? -11 : -29,
    radius: 4,
    fill: active ? GREEN : accent,
  }));
  card.add(rail);
  return card;
}

function uiMockup(accent: string): Rect {
  const box = new Rect({
    width: 760,
    height: 410,
    y: 365,
    radius: 32,
    smoothCorners: true,
    fill: 'rgba(11,36,53,0.94)',
    stroke: 'rgba(72,178,210,0.30)',
    lineWidth: 2,
    shadowColor: 'rgba(72,178,210,0.22)',
    shadowBlur: 28,
  });

  const top = new Rect({
    width: 700,
    height: 58,
    y: -145,
    radius: 18,
    fill: 'rgba(255,255,255,0.06)',
  });
  top.add(new Circle({size: 13, x: -308, fill: '#FF6B61'}));
  top.add(new Circle({size: 13, x: -280, fill: '#F6BE48'}));
  top.add(new Circle({size: 13, x: -252, fill: GREEN}));
  top.add(makeTxt({
    text: 'cotativa.com / intelligence',
    x: -105,
    fill: MUTED,
    fontSize: 16,
  }));
  box.add(top);

  const left = new Rect({width: 160, height: 190, x: -260, y: 75, radius: 22, fill: 'rgba(255,255,255,0.05)'});
  left.add(makeTxt({text: 'ALCANCE', y: -55, fill: MUTED, fontSize: 17}));
  left.add(makeTxt({text: '↑', y: 25, fill: GREEN, fontWeight: 800, fontSize: 64}));
  box.add(left);

  const middle = new Rect({width: 160, height: 190, x: -80, y: 75, radius: 22, fill: 'rgba(255,255,255,0.05)'});
  middle.add(makeTxt({text: 'INTENÇÃO', y: -55, fill: MUTED, fontSize: 17}));
  middle.add(makeTxt({text: '+', y: 25, fill: CYAN, fontWeight: 800, fontSize: 64}));
  box.add(middle);

  const right = new Rect({width: 300, height: 190, x: 170, y: 75, radius: 22, fill: 'rgba(255,255,255,0.05)'});
  right.add(makeTxt({text: 'CONVERSÃO', y: -55, fill: MUTED, fontSize: 17}));
  const rail = new Rect({width: 230, height: 12, y: 20, radius: 6, fill: 'rgba(255,255,255,0.08)'});
  rail.add(new Rect({width: 165, height: 12, x: -32, radius: 6, fill: accent}));
  right.add(rail);
  right.add(makeTxt({text: 'dados → ação', y: 60, fill: WHITE, opacity: 0.88, fontSize: 19}));
  box.add(right);

  return box;
}

export default makeScene2D('cotativa-premium', function* (view) {
  const briefSignal = useScene().variables.get('brief', fallbackBrief);
  const brief = (briefSignal() || fallbackBrief) as CotativaVideoBrief;
  const scenes = (brief.scenes?.length ? brief.scenes : fallbackBrief.scenes || []).slice(0, 5);
  const creativeStyle = String(brief.creative_style || 'enterprise_glow');
  const accentColor = styleAccent(creativeStyle);
  const secondsPerScene = Math.max(2.6, Math.min(4.2, Number(brief.seconds_per_scene || 3.15)));
  const watermarkMode = String(brief.watermark?.mode || 'subtle');
  const watermarkEnabled = brief.watermark?.enabled !== false && watermarkMode !== 'off';
  const watermarkOpacity = watermarkEnabled
    ? ({subtle: 0.055, medium: 0.085, brand_heavy: 0.13}[watermarkMode] ?? 0.055)
    : 0;

  view.fill(NAVY);

  const base = new Rect({width: 1080, height: 1920, fill: NAVY});
  const overlay = new Rect({width: 1080, height: 1920, fill: NAVY2, opacity: 0.55});
  const glowA = new Circle({
    size: 820,
    x: 360,
    y: -650,
    fill: GREEN,
    opacity: 0.12,
    filters: [blur(120)],
  });
  const glowB = new Circle({
    size: 980,
    x: -430,
    y: 560,
    fill: accentColor,
    opacity: 0.10,
    filters: [blur(150)],
  });
  const glowC = new Circle({
    size: 520,
    x: 360,
    y: 420,
    fill: VIOLET,
    opacity: 0.07,
    filters: [blur(110)],
  });

  view.add(base);
  view.add(overlay);
  view.add(glowA);
  view.add(glowB);
  view.add(glowC);
  view.add(new Rect({width: 920, height: 1, y: -750, fill: 'rgba(255,255,255,0.10)'}));
  view.add(new Rect({width: 920, height: 1, y: 760, fill: 'rgba(255,255,255,0.08)'}));

  const ambientA = yield loop(Infinity, () =>
    all(
      glowA.position.x(250, 4.8, easeInOutCubic).to(390, 4.8, easeInOutCubic),
      glowA.position.y(-560, 5.8, easeInOutCubic).to(-690, 5.8, easeInOutCubic),
      glowA.scale(1.12, 5.2, easeInOutCubic).to(0.92, 5.2, easeInOutCubic),
    ),
  );
  const ambientB = yield loop(Infinity, () =>
    all(
      glowB.position.x(-300, 6.4, easeInOutCubic).to(-470, 6.4, easeInOutCubic),
      glowB.position.y(430, 5.4, easeInOutCubic).to(650, 5.4, easeInOutCubic),
    ),
  );
  const ambientC = yield loop(Infinity, () =>
    all(
      glowC.rotation(180, 8, easeInOutCubic).to(360, 8, easeInOutCubic),
      glowC.opacity(0.13, 4, easeInOutCubic).to(0.05, 4, easeInOutCubic),
    ),
  );

  for (let index = 0; index < scenes.length; index++) {
    const scene = safeScene(scenes[index], index);
    const isPoster = creativeStyle === 'poster_glow';
    const isPerformance = creativeStyle === 'performance_ad';
    const isUi = creativeStyle === 'ui_mockup_flow';
    const isLast = index === scenes.length - 1;

    const group = new Node({opacity: 0, y: 70, scale: 0.97, cache: true});

    group.add(makeTxt({
      text: scene.label.toUpperCase(),
      x: -350,
      y: -835,
      fill: GREEN,
      fontWeight: 700,
      fontSize: 23,
      letterSpacing: 1.8,
      textAlign: 'left',
      width: 300,
    }));
    group.add(makeTxt({
      text: 'COTATIVA',
      x: 350,
      y: -835,
      fill: WHITE,
      opacity: 0.94,
      fontWeight: 800,
      fontSize: 24,
      textAlign: 'right',
      width: 300,
    }));

    let accentWord: Txt | null = null;
    if (isPoster) {
      accentWord = makeTxt({
        text: (scene.accent + '  ' + scene.accent).toUpperCase(),
        y: -500,
        x: -90,
        fill: accentColor,
        opacity: 0.10,
        fontWeight: 900,
        fontSize: 122,
        width: 1400,
        textAlign: 'center',
      });
      group.add(accentWord);
      group.add(makeTxt({
        text: (scene.accent + '  ' + scene.accent).toUpperCase(),
        y: -330,
        x: -90,
        fill: GREEN,
        opacity: 0.06,
        fontWeight: 900,
        fontSize: 96,
        width: 1400,
        textAlign: 'center',
      }));
    }

    const panel = new Rect({
      width: 900,
      height: isUi ? 1280 : 1200,
      y: 25,
      radius: 48,
      smoothCorners: true,
      fill: 'rgba(6,24,38,0.78)',
      stroke: 'rgba(255,255,255,0.11)',
      lineWidth: 2,
      shadowColor: 'rgba(0,0,0,0.42)',
      shadowBlur: 42,
      shadowOffset: [0, 24],
    });
    group.add(panel);
    panel.add(new Img({
      src: '/brand/cotativa-horizontal-claro.webp',
      width: 720,
      height: 108,
      y: 20,
      opacity: watermarkOpacity,
    }));
    panel.add(new Rect({width: 840, height: 2, y: -560, fill: 'rgba(255,255,255,0.12)'}));

    const iconBox = new Rect({
      width: 128,
      height: 128,
      x: -335,
      y: -485,
      radius: 34,
      smoothCorners: true,
      fill: 'rgba(78,220,132,0.10)',
      stroke: 'rgba(78,220,132,0.35)',
      lineWidth: 2,
      shadowColor: 'rgba(78,220,132,0.35)',
      shadowBlur: 35,
      scale: 0.72,
      rotation: -8,
    });
    const icon = new Img({
      src: '/icons/' + scene.icon + '.svg',
      width: 66,
      height: 66,
      opacity: 0.98,
    });
    iconBox.add(icon);
    panel.add(iconBox);

    const eyebrow = makeTxt({
      text: scene.eyebrow.toUpperCase(),
      x: 35,
      y: -500,
      width: 500,
      textAlign: 'left',
      fill: GREEN,
      opacity: 0,
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: 1.3,
    });
    panel.add(eyebrow);

    const headline = makeTxt({
      text: scene.headline,
      y: -234,
      width: 760,
      textAlign: 'left',
      textWrap: true,
      fill: WHITE,
      opacity: 0,
      fontWeight: 800,
      fontSize: isPoster ? 68 : 64,
      lineHeight: 78,
    });
    panel.add(headline);

    const body = makeTxt({
      text: scene.body,
      y: 124,
      width: 760,
      textAlign: 'left',
      textWrap: true,
      fill: MUTED,
      opacity: 0,
      fontWeight: 400,
      fontSize: 30,
      lineHeight: 43,
    });
    panel.add(body);

    let mockup: Rect | null = null;
    if (isUi) {
      mockup = uiMockup(accentColor);
      mockup.scale(0.94);
      mockup.opacity(0);
      mockup.filters.blur(10);
      panel.add(mockup);
    } else {
      panel.add(metricCard('VISIBILIDADE', '01', -260, index % 3 === 0, accentColor));
      panel.add(metricCard('INTENÇÃO', '02', 0, index % 3 === 1, accentColor));
      panel.add(metricCard('CONVERSÃO', '03', 260, index % 3 === 2, accentColor));
    }

    let cta: Rect | null = null;
    if (isPerformance || isLast) {
      cta = new Rect({
        width: 520,
        height: 108,
        y: 555,
        radius: 40,
        smoothCorners: true,
        fill: GREEN,
        opacity: 0,
        scale: 0.9,
        shadowColor: 'rgba(78,220,132,0.42)',
        shadowBlur: 34,
      });
      cta.add(new Img({src: '/icons-dark/brand-whatsapp.svg', width: 46, height: 46, x: -190}));
      cta.add(makeTxt({
        text: isLast ? 'FALE COM A COTATIVA' : 'TRANSFORME EM AÇÃO',
        x: 28,
        fill: NAVY,
        fontWeight: 900,
        fontSize: 25,
      }));
      panel.add(cta);
    } else {
      panel.add(makeTxt({
        text: 'MOTION • STRATEGY • PERFORMANCE',
        y: 560,
        fill: WHITE,
        opacity: 0.48,
        fontWeight: 700,
        fontSize: 17,
        letterSpacing: 1.6,
      }));
    }

    group.add(makeTxt({
      text: String(brief.brand?.tagline || 'TECNOLOGIA PARA NEGÓCIOS').toUpperCase(),
      x: -280,
      y: 835,
      width: 360,
      textAlign: 'left',
      fill: MUTED,
      opacity: 0.72,
      fontWeight: 700,
      fontSize: 16,
      letterSpacing: 1.2,
    }));
    group.add(makeTxt({
      text: String(brief.brand?.site || 'cotativa.com'),
      x: 360,
      y: 835,
      width: 260,
      textAlign: 'right',
      fill: WHITE,
      opacity: 0.90,
      fontWeight: 700,
      fontSize: 18,
    }));

    view.add(group);

    const enterAnimations = [
      group.opacity(1, 0.52, easeOutCubic),
      group.position.y(0, 0.52, easeOutCubic),
      group.scale(1, 0.52, easeOutCubic),
      panel.shadowBlur(58, 0.65, easeOutCubic),
      iconBox.scale(1, 0.58, easeOutCubic),
      iconBox.rotation(0, 0.58, easeOutCubic),
      icon.rotation(360, 0.85, easeOutCubic),
      eyebrow.opacity(1, 0.34, easeOutCubic),
      headline.opacity(1, 0.46, easeOutCubic),
      headline.position.y(-270, 0.52, easeOutCubic),
      body.opacity(1, 0.50, easeOutCubic),
      body.position.y(100, 0.56, easeOutCubic),
    ];

    if (mockup) {
      enterAnimations.push(mockup.opacity(1, 0.54, easeOutCubic));
      enterAnimations.push(mockup.scale(1, 0.54, easeOutCubic));
      enterAnimations.push(mockup.filters.blur(0, 0.54, easeOutCubic));
    }
    if (accentWord) {
      enterAnimations.push(accentWord.position.x(40, 2.2, easeInOutCubic));
    }
    if (cta) {
      enterAnimations.push(cta.opacity(1, 0.42, easeOutCubic));
      enterAnimations.push(cta.scale(1, 0.48, easeOutCubic));
    }

    yield* all(...enterAnimations);
    yield* waitFor(Math.max(1.45, secondsPerScene - 1.2));

    yield* all(
      group.opacity(0, 0.40, easeInOutCubic),
      group.position.y(-48, 0.42, easeInOutCubic),
      group.scale(1.025, 0.42, easeInOutCubic),
      group.filters.blur(9, 0.38, easeInOutCubic),
    );
    group.remove();

    if (!isLast) {
      const sweep = new Rect({
        width: 360,
        height: 2300,
        x: -820,
        rotation: -13,
        fill: accentColor,
        opacity: 0,
        filters: [blur(42)],
      });
      view.add(sweep);
      yield* all(
        sweep.opacity(0.22, 0.12, easeOutCubic).to(0, 0.36, easeInOutCubic),
        sweep.position.x(820, 0.48, easeInOutCubic),
      );
      sweep.remove();
    }
  }

  cancel(ambientA);
  cancel(ambientB);
  cancel(ambientC);
  yield* waitFor(0.15);
});
