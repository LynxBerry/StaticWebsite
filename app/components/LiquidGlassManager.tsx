'use client';

import { useEffect, useRef } from 'react';

const GLASS_SELECTOR = '.glass-card';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * Build the liquid-glass displacement map source.
 *
 * Mirrors Open Design's header-enhancer: a rounded pill with horizontal red
 * and vertical blue gradients plus a blurred center rectangle. The red and
 * blue channels drive the chromatic displacement.
 */
function buildGlassMap(w: number, h: number) {
  const radius = Math.round(Math.min(w, h) / 2);
  const borderRatio = 0.07;
  const lightness = 50;
  const alpha = 0.93;
  const blur = 11;
  const blend = 'difference';
  const inset = Math.min(w, h) * (borderRatio * 0.5);

  const svg =
    '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="red"/></linearGradient>' +
        '<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="blue"/></linearGradient>' +
      '</defs>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="black"/>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + radius + '" fill="url(#red)"/>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + radius + '" fill="url(#blue)" style="mix-blend-mode:' + blend + '"/>' +
      '<rect x="' + inset + '" y="' + inset + '" width="' + (w - inset * 2) + '" height="' + (h - inset * 2) + '" rx="' + radius + '" fill="hsl(0 0% ' + lightness + '% / ' + alpha + ')" style="filter:blur(' + blur + 'px)"/>' +
    '</svg>';

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function createFilterSvg(id: string) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'absolute w-0 h-0');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');

  const defs = document.createElementNS(SVG_NS, 'defs');
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  filter.setAttribute('x', '-20%');
  filter.setAttribute('y', '-20%');
  filter.setAttribute('width', '140%');
  filter.setAttribute('height', '140%');

  const feImage = document.createElementNS(SVG_NS, 'feImage');
  feImage.setAttribute('x', '0');
  feImage.setAttribute('y', '0');
  feImage.setAttribute('width', '100%');
  feImage.setAttribute('height', '100%');
  feImage.setAttribute('preserveAspectRatio', 'none');
  feImage.setAttribute('result', 'map');

  const steps = [
    { scale: -50, r: 1, g: 0, b: 0, name: 'red' },
    { scale: -47, r: 0, g: 1, b: 0, name: 'green' },
    { scale: -44, r: 0, g: 0, b: 1, name: 'blue' }
  ];

  filter.appendChild(feImage);

  let lastResult = '';
  steps.forEach((step, i) => {
    const disp = document.createElementNS(SVG_NS, 'feDisplacementMap');
    disp.setAttribute('in', 'SourceGraphic');
    disp.setAttribute('in2', 'map');
    disp.setAttribute('xChannelSelector', 'R');
    disp.setAttribute('yChannelSelector', 'B');
    disp.setAttribute('scale', String(step.scale));
    disp.setAttribute('result', 'disp' + step.name);

    const matrix = document.createElementNS(SVG_NS, 'feColorMatrix');
    matrix.setAttribute('in', 'disp' + step.name);
    matrix.setAttribute('type', 'matrix');
    matrix.setAttribute('values', `${step.r} 0 0 0 0 0 ${step.g} 0 0 0 0 0 ${step.b} 0 0 0 0 0 1 0`);
    matrix.setAttribute('result', step.name);

    filter.appendChild(disp);
    filter.appendChild(matrix);

    if (i === 0) {
      lastResult = step.name;
    } else {
      const blend = document.createElementNS(SVG_NS, 'feBlend');
      blend.setAttribute('in', lastResult);
      blend.setAttribute('in2', step.name);
      blend.setAttribute('mode', 'screen');
      blend.setAttribute('result', i === 1 ? 'rg' : 'output');
      filter.appendChild(blend);
      lastResult = i === 1 ? 'rg' : 'output';
    }
  });

  const blurEl = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blurEl.setAttribute('in', 'output');
  blurEl.setAttribute('stdDeviation', '0.7');
  filter.appendChild(blurEl);

  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  return feImage;
}

/**
 * Automatically applies a per-element liquid-glass filter to every
 * `.glass-card` in the DOM.
 *
 * Each card gets its own SVG filter whose displacement map is sized to the
 * card's live bounds, so the rounded-pill refraction tracks the element.
 * A ResizeObserver keeps the map in sync as cards change size.
 */
export default function LiquidGlassManager() {
  const registryRef = useRef(() => new Map<Element, { image: SVGFEImageElement; ro: ResizeObserver }>());
  const registry = registryRef.current();

  useEffect(() => {
    const syncMap = (el: Element, image: SVGFEImageElement) => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const uri = buildGlassMap(w, h);
      image.setAttribute('href', uri);
      image.setAttributeNS(XLINK_NS, 'href', uri);
    };

    const applyTo = (el: Element) => {
      if (registry.has(el)) return;
      if (!(el instanceof HTMLElement)) return;

      const id = 'liquid-glass-' + Math.random().toString(36).slice(2, 9);
      const image = createFilterSvg(id);

      el.style.backdropFilter = `url(#${id}) blur(7px) saturate(1.4)`;
      (el.style as unknown as Record<string, string>).webkitBackdropFilter = `url(#${id}) blur(7px) saturate(1.4)`;

      syncMap(el, image);

      const ro = new ResizeObserver(() => syncMap(el, image));
      ro.observe(el);

      registry.set(el, { image, ro });
    };

    const removeFrom = (el: Element) => {
      const entry = registry.get(el);
      if (!entry) return;
      entry.ro.disconnect();
      const id = entry.image.closest('filter')?.getAttribute('id');
      if (id) {
        const svg = document.getElementById(id)?.closest('svg');
        svg?.remove();
      }
      if (el instanceof HTMLElement) {
        el.style.backdropFilter = '';
        (el.style as unknown as Record<string, string>).webkitBackdropFilter = '';
      }
      registry.delete(el);
    };

    document.querySelectorAll(GLASS_SELECTOR).forEach(applyTo);

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as Element;
          if (el.matches(GLASS_SELECTOR)) applyTo(el);
          el.querySelectorAll(GLASS_SELECTOR).forEach(applyTo);
        }
        for (const node of mutation.removedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as Element;
          if (el.matches(GLASS_SELECTOR)) removeFrom(el);
          el.querySelectorAll(GLASS_SELECTOR).forEach(removeFrom);
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      registry.forEach((entry) => {
        entry.ro.disconnect();
        const id = entry.image.closest('filter')?.getAttribute('id');
        if (id) {
          const svg = document.getElementById(id)?.closest('svg');
          svg?.remove();
        }
      });
      registry.clear();
    };
  }, [registry]);

  return null;
}
