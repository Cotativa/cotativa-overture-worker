import {makeProject} from '@revideo/core';
import premium from './scenes/premium.js';

export default makeProject({
  name: 'cotativa-premium-enterprise',
  scenes: [premium],
  settings: {
    shared: {
      background: '#071520',
      range: [0, Infinity],
      size: {x: 1080, y: 1920},
    },
    preview: {
      fps: 30,
      resolutionScale: 1,
    },
    rendering: {
      exporter: {
        name: '@revideo/core/wasm',
      },
      fps: 30,
      resolutionScale: 1,
      colorSpace: 'srgb',
    },
  },
});
