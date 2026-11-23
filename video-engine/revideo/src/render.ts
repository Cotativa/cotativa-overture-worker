import {readFileSync, copyFileSync, mkdirSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {renderVideo} from '@revideo/renderer';
import type {CotativaVideoBrief} from './types.js';

const sourceArg = process.argv.find(arg => arg.startsWith('--source='));
const sourcePath = resolve(sourceArg ? sourceArg.slice('--source='.length) : '../../source.json');
const raw = readFileSync(sourcePath, 'utf8');
const brief = JSON.parse(raw) as CotativaVideoBrief;

if ((brief.schema ?? 0) < 4) throw new Error('Creative brief schema 4+ required.');
if (brief.style !== 'revideo_enterprise_v1') throw new Error('Unexpected video engine style.');
if (!Array.isArray(brief.scenes) || brief.scenes.length < 2) throw new Error('At least 2 scenes are required.');

const outDir = resolve('./out');
mkdirSync(outDir, {recursive: true});

let lastPercent = -1;
const rendered = await renderVideo({
  projectFile: './src/project.ts',
  variables: {brief},
  settings: {
    outDir,
    outFile: 'radar-short.mp4',
    workers: 1,
    logProgress: true,
    ffmpeg: {
      ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
      ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
      ffmpegLogLevel: 'error',
    },
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-software-rasterizer', '--no-zygote', '--single-process'],
    },
    projectSettings: {
      exporter: {
        name: '@revideo/core/wasm',
      },
    },
    progressCallback: (_worker, progress) => {
      const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
      if (pct >= lastPercent + 5) {
        lastPercent = pct;
        console.log('COTATIVA_REVIDEO_PROGRESS=' + pct);
      }
    },
  },
});

const finalPath = resolve('../../radar-short.mp4');
if (!existsSync(rendered)) throw new Error('Revideo returned a missing output file.');
mkdirSync(dirname(finalPath), {recursive: true});
copyFileSync(rendered, finalPath);

console.log('COTATIVA_REVIDEO_DONE=' + finalPath);
