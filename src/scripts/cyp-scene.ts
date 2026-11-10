// CYP3A4 active site, drawn from public crystal structures (RCSB PDB 2V0M and 3NXU, chain A).
// The Fe-N distance is computed from the coordinates in the browser; nothing is hard-coded.
import * as mod from '3dmol';

const $3D: any = (mod as any).default?.createViewer ? (mod as any).default : mod;
const BASE: string = import.meta.env.BASE_URL;

// Two palettes: the fold is kept in cool slate tones, the ligand and the iron carry the warm colours.
const PALETTE = {
  dark: {
    helix: '#6f92cb', sheet: '#a3b9dc', coil: '#56688a', pocketC: '#c3d0e3', ligC: '#f6f8fc', hemeC: '#d4726d',
    N: '#7aa2ff', O: '#ef6a70', S: '#ecd35f', P: '#f2a64e', Fe: '#f08a4b', surf: '#7ea4ff', surfOpacity: 0.13, halo: '#ff9c52',
  },
  light: {
    helix: '#3c64a8', sheet: '#6a88b9', coil: '#97a5bd', pocketC: '#4e5f7b', ligC: '#18243b', hemeC: '#b6413c',
    N: '#2f5fd0', O: '#cf3f45', S: '#b8941a', P: '#cc7a1c', Fe: '#d9622a', surf: '#3d6fe0', surfOpacity: 0.1, halo: '#e5773d',
  },
};
type Pal = (typeof PALETTE)['dark'];
const palette = (): Pal => (document.documentElement.dataset.theme === 'light' ? PALETTE.light : PALETTE.dark);
const elem = (p: Pal, a: any, carbon: string) => (a.elem === 'C' ? carbon : ((p as any)[a.elem] ?? (a.elem === 'FE' ? p.Fe : carbon)));
const bgColor = () => getComputedStyle(document.documentElement).getPropertyValue('--bg-deep').trim() || '#0b111b';

const pdbCache = new Map<string, string>();
let metaCache: Record<string, any> | null = null;

async function loadPdb(code: string): Promise<string> {
  if (!pdbCache.has(code)) pdbCache.set(code, await (await fetch(`${BASE}data/${code}_A.pdb`)).text());
  return pdbCache.get(code)!;
}
async function loadMeta(): Promise<Record<string, any>> {
  if (!metaCache) metaCache = await (await fetch(`${BASE}data/meta.json`)).json();
  return metaCache!;
}

export interface SceneOptions {
  variant: 'hero' | 'explorer';
  code: string;
  spin: boolean;
  onReadout?: (x: number, y: number, distance: number, ligand: string) => void;
  onPick?: (text: string) => void;
}

export interface Scene {
  setCode(code: string): Promise<void>;
  setLayer(layer: 'cartoon' | 'pocket' | 'surface', on: boolean): void;
  setMeasure(on: boolean): void;
  clearMeasures(): void;
  setSpin(on: boolean): void;
  destroy(): void;
  distance(): number;
}

export async function mountCypScene(el: HTMLElement, opts: SceneOptions): Promise<Scene> {
  const viewer = $3D.createViewer(el, { backgroundAlpha: 0, antialias: true });
  const layers = { cartoon: true, pocket: true, surface: false };
  let current = opts.code;
  let m: any = null;
  let fe: any = null;
  let nAtom: any = null;
  let dist = 0;
  let measure = false;
  let picks: any[] = [];
  let measureShapes: any[] = [];
  let surf: any = null;
  let spinning = opts.spin;
  let raf = 0;
  let visible = true;
  let resumeTimer: number | undefined;

  function style() {
    const p = palette();
    viewer.removeAllSurfaces();
    surf = null;
    viewer.setStyle({}, {});
    const hero = opts.variant === 'hero';
    const ligSel = { resn: m.ligand, resi: m.resid };
    if (layers.cartoon) {
      viewer.setStyle(
        { hetflag: false },
        {
          cartoon: {
            colorfunc: (a: any) => (a.ss === 'h' ? p.helix : a.ss === 's' ? p.sheet : p.coil),
            opacity: 1,
            thickness: hero ? 0.55 : 0.5,
            arrows: true,
          },
        }
      );
    }
    const near = { within: { distance: hero ? 5 : 7, sel: ligSel }, byres: true, hetflag: false };
    if (layers.pocket) {
      viewer.addStyle(near, { stick: { radius: hero ? 0.1 : 0.12, colorfunc: (a: any) => elem(p, a, p.pocketC) } });
    }
    viewer.addStyle({ resn: 'HEM' }, { stick: { radius: hero ? 0.17 : 0.2, colorfunc: (a: any) => elem(p, a, p.hemeC) } });
    viewer.addStyle({ serial: m.feSerial }, { sphere: { radius: hero ? 0.62 : 0.7, color: p.Fe } });
    viewer.addStyle(ligSel, {
      stick: { radius: hero ? 0.2 : 0.22, colorfunc: (a: any) => elem(p, a, p.ligC) },
      sphere: { scale: hero ? 0.3 : 0.32, colorfunc: (a: any) => elem(p, a, p.ligC) },
    });
    if (layers.surface || hero) {
      surf = viewer.addSurface($3D.SurfaceType.VDW, { opacity: hero ? p.surfOpacity : 0.2, color: p.surf }, { within: { distance: hero ? 6 : 8, sel: ligSel }, byres: true, hetflag: false });
    }
  }

  function bond() {
    const all = viewer.getModel().selectedAtoms({});
    fe = all.find((a: any) => a.serial === m.feSerial);
    nAtom = all.find((a: any) => a.serial === m.nSerial);
    dist = Math.hypot(fe.x - nAtom.x, fe.y - nAtom.y, fe.z - nAtom.z);
    const p = palette();
    viewer.addSphere({ center: { x: fe.x, y: fe.y, z: fe.z }, radius: 1.45, color: p.halo, alpha: 0.16 });
    viewer.addCylinder({
      start: { x: fe.x, y: fe.y, z: fe.z },
      end: { x: nAtom.x, y: nAtom.y, z: nAtom.z },
      radius: 0.07,
      color: p.halo,
      dashed: true,
      fromCap: 1,
      toCap: 1,
    });
  }

  function frameView() {
    // The slab is set relative to the ligand: the protein in front of it is cut away, so the ligand
    // and the heme stay visible while the fold keeps turning behind them.
    viewer.zoomTo({ within: { distance: opts.variant === 'hero' ? 13 : 11, sel: { serial: m.feSerial } } });
    if (opts.variant === 'hero') {
      const narrow = el.clientWidth < 700;
      viewer.setSlab(-12, 22);
      viewer.zoom(narrow ? 0.62 : 1.0);
      // 3Dmol screen axes: negative x moves the scene left, positive y moves it up.
      viewer.translate(narrow ? 0 : -Math.round(el.clientWidth * 0.1), Math.round(el.clientHeight * (narrow ? 0.1 : 0.07)));
    } else {
      viewer.setSlab(-18, 40);
      viewer.zoom(0.95);
    }
  }

  function readout() {
    if (!opts.onReadout || !fe || !nAtom) return;
    const mid = { x: (fe.x + nAtom.x) / 2, y: (fe.y + nAtom.y) / 2, z: (fe.z + nAtom.z) / 2 };
    const p = viewer.modelToScreen ? viewer.modelToScreen(mid) : null;
    if (p) opts.onReadout(p.x, p.y, dist, m.ligandName ?? m.ligand);
  }

  function tick(t: number) {
    raf = requestAnimationFrame(tick);
    if (!visible || !spinning || document.hidden) {
      last = t;
      return;
    }
    const dt = Math.min(t - last, 64);
    last = t;
    viewer.rotate(dt * 0.0026, 'y', 0);
    viewer.render();
    readout();
  }
  let last = 0;

  function pause(ms = 2500) {
    const wasSpinning = spinning;
    spinning = false;
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => (spinning = wasSpinning && opts.spin), ms);
  }

  async function setCode(code: string) {
    current = code;
    const [text, meta] = await Promise.all([loadPdb(code), loadMeta()]);
    m = meta[code];
    viewer.clear();
    viewer.setBackgroundColor(bgColor(), 0);
    viewer.addModel(text, 'pdb');
    style();
    bond();
    frameView();
    viewer.render();
    readout();
    clearMeasures();
  }

  function clearMeasures() {
    measureShapes.forEach((s) => viewer.removeShape(s));
    viewer.removeAllLabels();
    measureShapes = [];
    picks = [];
    opts.onPick?.('');
    viewer.render();
  }

  function onAtomClick(atom: any) {
    if (!measure || !atom) return;
    picks.push(atom);
    measureShapes.push(viewer.addSphere({ center: { x: atom.x, y: atom.y, z: atom.z }, radius: 0.28, color: '#e8cf5a', alpha: 0.9 }));
    const name = `${atom.resn} ${atom.resi} ${atom.atom}`;
    if (picks.length === 2) {
      const [a, b] = picks;
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      measureShapes.push(
        viewer.addCylinder({ start: { x: a.x, y: a.y, z: a.z }, end: { x: b.x, y: b.y, z: b.z }, radius: 0.05, color: '#e8cf5a', dashed: true, fromCap: 1, toCap: 1 })
      );
      viewer.addLabel(`${d.toFixed(2)} Å`, {
        position: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 },
        backgroundColor: '#0a111c',
        backgroundOpacity: 0.8,
        fontColor: '#e8cf5a',
        fontSize: 14,
        borderThickness: 0,
        inFront: true,
      });
      opts.onPick?.(`${a.resn} ${a.resi} ${a.atom} to ${b.resn} ${b.resi} ${b.atom}: ${d.toFixed(2)} Å`);
      picks = [];
      window.setTimeout(() => {
        // keep the last measurement visible; the next click starts a new pair
      }, 0);
    } else {
      opts.onPick?.(`First atom: ${name}. Pick a second atom.`);
    }
    viewer.render();
  }

  // The page keeps its scroll: wheel events must not reach the viewer's zoom handler in the hero.
  if (opts.variant === 'hero') el.addEventListener('wheel', (e) => e.stopPropagation(), { capture: true, passive: true });
  el.addEventListener('pointerdown', () => pause(4000));

  const io = new IntersectionObserver((entries) => (visible = entries[0].isIntersecting), { threshold: 0.05 });
  io.observe(el);
  const ro = new ResizeObserver(() => {
    viewer.resize();
    viewer.render();
  });
  ro.observe(el);

  const onTheme = () => {
    if (!m) return;
    viewer.setBackgroundColor(bgColor(), 0);
    viewer.removeAllShapes();
    style();
    bond();
    viewer.render();
  };
  document.addEventListener('themechange', onTheme);

  viewer.setClickable({}, true, onAtomClick);
  await setCode(opts.code);
  raf = requestAnimationFrame(tick);

  return {
    setCode,
    setLayer(layer, on) {
      layers[layer] = on;
      viewer.removeAllShapes();
      style();
      bond();
      viewer.render();
    },
    setMeasure(on) {
      measure = on;
      if (!on) clearMeasures();
    },
    clearMeasures,
    setSpin(on) {
      spinning = on && opts.spin;
    },
    destroy() {
      cancelAnimationFrame(raf);
      document.removeEventListener('themechange', onTheme);
      io.disconnect();
      ro.disconnect();
      viewer.clear();
    },
    distance: () => dist,
  };
}
