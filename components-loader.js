/* =========================================================
   COMPONENTS-LOADER.JS — Dr. Calvario
   Inyecta los componentes modulares vía fetch en cualquier
   <div data-include="..."></div> presente en la página.
   Maneja:
   - Inyección HTML y ejecución de <script> embebido
   - Reveal animations on scroll (IntersectionObserver)
   - FAQ acordeones accesibles (details/summary)
   - Auto-cierre del dropdown del navbar al click fuera
   - Prevención de FOUC con .is-loaded flag
   ========================================================= */

(function () {
  'use strict';

  // --- 1. Inyector de componentes ----------------------------------
  async function injectComponent(placeholder) {
    const url = placeholder.getAttribute('data-include');
    if (!url) return;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
      const html = await res.text();
      const tmp = document.createElement('div');
      tmp.innerHTML = html;

      // Extraer scripts para ejecutarlos después de inyectar
      const scripts = Array.from(tmp.querySelectorAll('script'));
      scripts.forEach(s => s.parentNode.removeChild(s));

      // Reemplazar placeholder por el HTML real
      const frag = document.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      placeholder.replaceWith(frag);

      // Re-ejecutar scripts
      scripts.forEach(s => {
        const n = document.createElement('script');
        Array.from(s.attributes).forEach(a => n.setAttribute(a.name, a.value));
        if (s.src) n.src = s.src;
        else n.textContent = s.textContent;
        document.body.appendChild(n);
      });
    } catch (err) {
      console.error('[components-loader] Error al inyectar ' + url, err);
      placeholder.innerHTML = '<!-- error al cargar componente ' + url + ' -->';
    }
  }

  async function loadAll() {
    const placeholders = Array.from(document.querySelectorAll('[data-include]'));
    await Promise.all(placeholders.map(injectComponent));
    document.documentElement.classList.add('is-loaded');
    initInteractions();
  }

  // --- 2. Reveal on scroll ------------------------------------------
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) {
      items.forEach(i => i.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(i => obs.observe(i));
  }

  // --- 3. Smooth scroll para anchors internos -----------------------
  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const tgt = document.getElementById(id);
      if (tgt) {
        e.preventDefault();
        const y = tgt.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  }

  // --- 4. Cerrar dropdown al hacer clic fuera ----------------------
  function initDropdownClose() {
    document.addEventListener('click', (e) => {
      const drop = e.target.closest('.navbar__dropdown');
      const all = document.querySelectorAll('.navbar__dropdown.is-open');
      all.forEach(d => { if (d !== drop) d.classList.remove('is-open'); });
    });
  }

  // --- 5. Forzar un solo acordeón FAQ abierto a la vez -------------
  function initFaqSingle() {
    document.addEventListener('toggle', (e) => {
      const item = e.target;
      if (!item.matches('.faq__item')) return;
      if (item.open) {
        document.querySelectorAll('.faq__item[open]').forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    }, true);
  }

  function initInteractions() {
    initReveal();
    initAnchors();
    initDropdownClose();
    initFaqSingle();
  }

  // --- 6. Arranque ---------------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAll);
  } else {
    loadAll();
  }
})();
