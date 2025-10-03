/*
  Script principal du site A2S
  - Navigation (mobile + sous-menus)
  - Révélations au scroll
  - Historique (timeline + onglets)
  - Lightbox de galerie
  - Animations GSAP (hero, intro, galerie, partenaires, KPI, footer)
  Respecte prefers-reduced-motion et évite les erreurs si un bloc est absent.
*/
// Navigation : ouverture/fermeture + sous-menus
// Navigation toggle and submenu handling
(function(){
  const nav = document.querySelector('.nav');
  const btn = document.querySelector('.menu-button');
  if (btn && nav) {
    btn.addEventListener('click', function(){
      const isOpen = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) closeAllSubmenus();
    });
  }

  function closeAllSubmenus(){
    document.querySelectorAll('.has-submenu.open').forEach(function(li){
      li.classList.remove('open');
      const b = li.querySelector('button.nav-link');
      if (b) b.setAttribute('aria-expanded','false');
    });
  }

  document.querySelectorAll('.has-submenu > button.nav-link').forEach(function(t){
    t.addEventListener('click', function(){
      const li = t.parentElement;
      const expanded = li.classList.toggle('open');
      t.setAttribute('aria-expanded', String(expanded));
    });
  });

  // Fermer la navigation avec Échap
  // Close nav on Escape
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && nav && nav.classList.contains('open')){
      nav.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded','false');
      closeAllSubmenus();
    }
  });

  // Réinitialiser l'état en repassant sur desktop
  // Reset state when resizing to desktop
  window.addEventListener('resize', function(){
    if (window.innerWidth > 768 && nav){
      nav.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded','false');
      closeAllSubmenus();
    }
  });
  // Révélation au défilement pour les éléments .reveal
  // Reveal-on-scroll for elements with .reveal
  const toReveal = Array.from(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && toReveal.length){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if (e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, {root:null, rootMargin:'0px 0px -10% 0px', threshold:0.1});
    toReveal.forEach(el=>io.observe(el));
  } else {
    // Fallback: show immediately
    toReveal.forEach(el=>el.classList.add('is-visible'));
  }

  // Timeline year click → show details panel (Historique)
  (function(){
    const years = Array.from(document.querySelectorAll('.timeline-pro .tp-year'));
    if (!years.length) return;
    const details = document.querySelector('.timeline-pro .tp-details');
    if (!details) return;

    function showDetails(yearBtn){
      const year = (yearBtn.dataset.year || yearBtn.textContent || '').trim();
      const x = yearBtn.style.getPropertyValue('--x') || getComputedStyle(yearBtn).getPropertyValue('--x') || '50%';
      // find matching event by badge year
      let iconHTML = '';
      let textHTML = year;
      const badge = Array.from(document.querySelectorAll('.timeline-pro .tp-event .tp-badge')).find(b=>b.textContent.trim()===year);
      if (badge){
        const title = badge.parentElement; // .title
        textHTML = title.textContent.trim();
        const icon = title.parentElement.querySelector('.icon');
        if (icon) iconHTML = icon.innerHTML;
      }
      details.style.setProperty('--x', x);
      const iconBox = details.querySelector('.tp-details-card .icon');
      const textBox = details.querySelector('.tp-details-card .text');
      if (iconBox) iconBox.innerHTML = iconHTML || '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>';
      if (textBox) textBox.textContent = textHTML;
      details.hidden = false;
      years.forEach(b=>b.classList.toggle('active', b===yearBtn));
    }

    years.forEach(btn=>{
      btn.addEventListener('click', ()=>showDetails(btn));
      btn.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); showDetails(btn);} });
    });
  })();

  // Historique (onglets) : clic sur une pastille d'année -> panneau associé
  // History tabs (original view): click year-chip to reveal associated panel
  (function(){
    const wrap = document.querySelector('.history-pro');
    if(!wrap) return;
    const chips = Array.from(wrap.querySelectorAll('.year-chip'));
    const panels = Array.from(wrap.querySelectorAll('.year-panel'));
    function activate(year){
      chips.forEach(c=>{
        const on = c.dataset.year===year;
        c.classList.toggle('active', on);
        c.setAttribute('aria-selected', on?'true':'false');
      });
      panels.forEach(p=>{
        const on = p.dataset.year===year;
        const wasActive = p.classList.contains('active');
        p.classList.toggle('active', on);
        p.setAttribute('aria-hidden', on?'false':'true');
        if (on && !wasActive){
          // retrigger animation by forcing reflow
          void p.offsetWidth;
          p.classList.add('animating');
          p.addEventListener('animationend', function h(){ p.classList.remove('animating'); p.removeEventListener('animationend', h);});
        }
      });
    }
    chips.forEach(chip=>{
      chip.addEventListener('click', ()=>activate(chip.dataset.year));
      chip.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); activate(chip.dataset.year);} });
    });
    // ensure one active on load
    const current = chips.find(c=>c.classList.contains('active')) || chips[0];
    if(current) activate(current.dataset.year);
  })();

  // History cards (grid): exclusive open + update header title
  (function(){
    const cards = Array.from(document.querySelectorAll('.history-grid .history-card'));
    if(!cards.length) return;
    const titlesByYear = {
      '2009':'Création',
      '2012':'xxxxxx',
      '2017':'xxxxx',
      '2025':'xxxxxx'
    };
    titlesByYear['2009'] = 'Création';
    const headerTone = document.querySelector('.hist-title .tone');
    const headerStrong = document.querySelector('.hist-title .strong');
    cards.forEach(card=>{
      const year = (card.querySelector('.year-badge')?.textContent||'').trim();
      const existingP = card.querySelector('p');
      const text = existingP ? existingP.textContent.trim() : '';
      if (existingP) existingP.remove();
      // Title row
      const title = document.createElement('h3');
      title.className = 'hc-title';
      title.textContent = titlesByYear[year] || 'Histoire';
      // Chevron icon
      const svgNS = 'http://www.w3.org/2000/svg';
      const chevron = document.createElementNS(svgNS,'svg');
      chevron.setAttribute('viewBox','0 0 24 24');
      chevron.classList.add('hc-chevron');
      const path = document.createElementNS(svgNS,'path');
      path.setAttribute('d','M6 9l6 6 6-6');
      path.setAttribute('fill','none');
      path.setAttribute('stroke','currentColor');
      path.setAttribute('stroke-width','2');
      path.setAttribute('stroke-linecap','round');
      path.setAttribute('stroke-linejoin','round');
      chevron.appendChild(path);
      title.appendChild(chevron);
      // Details container
      const details = document.createElement('div');
      details.className = 'hc-details';
      const para = document.createElement('p');
      para.textContent = text;
      details.appendChild(para);
      card.appendChild(title);
      card.appendChild(details);
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      const openExclusive = ()=>{
        cards.forEach(c=>{ if(c!==card) c.classList.remove('open'); });
        card.classList.add('open');
        // Update header title: replace "Histoire" by event title
        if (headerTone){ headerTone.textContent = title.textContent.trim(); }
        // Optional: if the event title contient "entreprise", on peut vider la seconde ligne pour éviter la redite
        if (headerStrong && /entreprise/i.test(title.textContent)) { headerStrong.textContent = ''; }
      };
      card.addEventListener('click', (e)=>{
        // avoid toggling if clicking a link inside details
        const target = e.target;
        if (target.closest && target.closest('a')) return;
        openExclusive();
      });
      card.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openExclusive(); } });
    });
    // Optionally open the most recent by default
    const defaultCard = cards[cards.length-1];
    if (defaultCard){ defaultCard.classList.add('open');
      const t = defaultCard.querySelector('.hc-title'); if (headerTone && t){ headerTone.textContent = t.textContent.trim(); if (headerStrong && /entreprise/i.test(t.textContent)) headerStrong.textContent=''; }
    }
  })();

  // Lightbox simple pour la galerie
  // Simple lightbox for galerie
  (function(){
    const links = Array.from(document.querySelectorAll('[data-lightbox]'));
    if (!links.length) return;
    let overlay;
    function ensureOverlay(){
      if (overlay) return overlay;
      overlay = document.createElement('div');
      overlay.className = 'lb-overlay';
      overlay.innerHTML = `
        <button class="lb-close" aria-label="Fermer">✕</button>
        <div class="lb-content">
          <div class="lb-media"><img alt="" /></div>
          <div class="lb-caption" role="note"></div>
        </div>`;
      document.body.appendChild(overlay);
      const closeBtn = overlay.querySelector('.lb-close');
      if (closeBtn) closeBtn.innerHTML = '&times;';
      overlay.addEventListener('click', (e)=>{
        if (e.target === overlay) close();
      });
      overlay.querySelector('.lb-close').addEventListener('click', close);
      return overlay;
    }
    function open(src, caption){
      const ov = ensureOverlay();
      const img = ov.querySelector('img');
      const cap = ov.querySelector('.lb-caption');
      img.src = src; img.alt = caption || '';
      cap.textContent = caption || '';
      ov.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close(){
      if (!overlay) return;
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
    links.forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const src = a.getAttribute('href');
        const caption = a.getAttribute('data-caption') || a.querySelector('img')?.alt || '';
        open(src, caption);
      });
    });
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });
  })();
})();
  // Animations GSAP
  // GSAP Animations
    document.addEventListener('DOMContentLoaded', () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        gsap.set('.gsap-anim, .gsap-social', { opacity: 1, y: 0, scale: 1, rotation: 0 });
        return;
      }

      gsap.registerPlugin(ScrollTrigger);

      // Animations du hero
      // Hero Animations
      gsap.from('.hero-home .headline', {
        autoAlpha: 0,
        y: 30,
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.hero-home', start: 'top 80%' }
      });
      gsap.from('.hero-home .sub', {
        autoAlpha: 0,
        y: 30,
        scale: 0.95,
        duration: 0.8,
        delay: 0.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.hero-home', start: 'top 80%' }
      });
      gsap.from('.hero-home .cta', {
        autoAlpha: 0,
        y: 30,
        scale: 0.95,
        duration: 0.8,
        delay: 0.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.hero-home', start: 'top 80%' }
      });
      gsap.from('.hero-home .visual img', {
        autoAlpha: 0,
        scale: 0.8,
        rotation: -5,
        duration: 1,
        ease: 'elastic.out(1, 0.75)',
        scrollTrigger: { trigger: '.hero-home', start: 'top 80%' }
      });

      // Parallaxe du fond du hero
      // Parallax Background for Hero
      gsap.to('.hero-home', {
        backgroundPosition: 'center 60%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-home',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });

      // Section intro — animations
      // Intro Section - Enhanced Animation
      gsap.from('.intro .intro-block', {
        autoAlpha: 0,
        y: 20,
        scale: 0.9,
        rotation: 2,
        duration: 0.8,
        stagger: 0.3,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.intro', start: 'top 80%' }
      });
      gsap.from('.intro .kicker', {
        autoAlpha: 0,
        y: 10,
        duration: 0.6,
        stagger: 0.3,
        delay: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.intro', start: 'top 80%' }
      });
      gsap.from('.intro .sub', {
        autoAlpha: 0,
        y: 10,
        duration: 0.6,
        stagger: 0.3,
        delay: 0.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.intro', start: 'top 80%' }
      });

      // Galerie
      // Gallery
      gsap.from('#galerie figure', {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '#galerie', start: 'top 80%' }
      });

      // Marquee des partenaires
      // Partners Marquee
      const partnersTrack = document.querySelector('.partners-track');
      if (partnersTrack) {
      gsap.to('.partners-track', {
        x: () => -partnersTrack.scrollWidth / 2,
        ease: 'none',
        repeat: -1,
        duration: 12, // Faster for smoother effect
        scrollTrigger: { trigger: '.partners', start: 'top 80%' }
      });
      gsap.from('.partners-track img', {
        autoAlpha: 0,
        y: 10,
        scale: 0.95,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.partners', start: 'top 80%' }
      });
      partnersTrack.addEventListener('mouseenter', () => gsap.to('.partners-track', { timeScale: 0 }));
      partnersTrack.addEventListener('mouseleave', () => gsap.to('.partners-track', { timeScale: 1 }));
      }

      // Indicateurs (KPIs)
      // KPIs
      gsap.from('.kpi-grid .kpi', {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.kpi-grid', start: 'top 80%' }
      });
      gsap.from('.kpi-grid .kpi-value', {
        scale: 1.2,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        scrollTrigger: { trigger: '.kpi-grid', start: 'top 80%' }
      });
      gsap.from('.kpi-grid .cta', {
        autoAlpha: 0,
        y: 20,
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.kpi-grid', start: 'top 80%' }
      });

      // Pied de page
      // Footer
      gsap.from('footer .gsap-anim', {
        autoAlpha: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: { trigger: 'footer', start: 'top 80%' }
      });
      gsap.utils.toArray('.gsap-social').forEach(link => {
        link.addEventListener('mouseenter', () => {
          gsap.to(link.querySelector('svg'), { scale: 1.2, rotation: 15, duration: 0.3, ease: 'power2.out' });
        });
        link.addEventListener('mouseleave', () => {
          gsap.to(link.querySelector('svg'), { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.out' });
        });
      });

      // Le menu mobile est géré par nav.open + CSS (voir plus haut)
      // Mobile Menu Animation is handled by the nav.open toggle above + CSS
    });
  
