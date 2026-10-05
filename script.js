(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const GITHUB_USER = '';
  const FORM_ENDPOINT = '';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Loader ----------
  const loader = document.getElementById('loader');
  let loaderHidden = false;
  function hideLoader() {
    if (loaderHidden || !loader) return;
    loaderHidden = true;
    loader.classList.add('done');
    setTimeout(() => loader.remove(), 600);
  }
  if (loader) {
    if (reduceMotion) loader.remove();
    else {
      if (document.readyState === 'complete') setTimeout(hideLoader, 350);
      else window.addEventListener('load', () => setTimeout(hideLoader, 500));
      setTimeout(hideLoader, 3000);
    }
  }

  // ---------- Theme ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeColorMeta = document.getElementById('theme-color');
  const THEME_COLORS = { light: '#F6F6F3', dark: '#0E0E1A' };

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    if (themeColorMeta) themeColorMeta.content = THEME_COLORS[theme];
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  if (themeToggle) themeToggle.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });

  // ---------- Custom cursor ----------
  const cursor = document.getElementById('cursor');
  const cursorDot = document.getElementById('cursor-dot');
  if (cursor && cursorDot && finePointer && !reduceMotion) {
    let mx = -100, my = -100, cx = -100, cy = -100;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top = my + 'px';
    });
    (function loop() {
      cx += (mx - cx) * 0.16;
      cy += (my - cy) * 0.16;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', (e) => {
      const hot = e.target.closest('a, button, [role="button"], summary, input, textarea');
      cursor.classList.toggle('hot', !!hot);
    });
    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      cursorDot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      cursorDot.style.opacity = '1';
    });
  } else if (cursor && cursorDot) {
    cursor.remove();
    cursorDot.remove();
  }

  // ---------- Scroll progress + nav state + back to top ----------
  const progress = document.getElementById('progress');
  const nav = document.querySelector('.nav');
  const backTop = document.getElementById('back-top');

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('scrolled', y > 10);
    backTop.hidden = y < 400;
    backTop.classList.toggle('show', y >= 400);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backTop.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  );

  // ---------- Mobile nav ----------
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  toggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );

  // ---------- Scroll reveal ----------
  const revealEls = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // ---------- Active section highlighting ----------
  const sections = $$('main section[id]');
  const dotLinks = $$('.dot-nav a');
  const linkMap = new Map();
  navLinks.querySelectorAll('a').forEach((a) => linkMap.set(a.getAttribute('href').slice(1), a));

  function setActive(id) {
    linkMap.forEach((a) => a.classList.remove('active'));
    dotLinks.forEach((a) => a.classList.remove('active'));
    const link = linkMap.get(id);
    if (link) link.classList.add('active');
    const dot = dotLinks.find((a) => a.getAttribute('href') === '#' + id);
    if (dot) dot.classList.add('active');
  }

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => sectionObserver.observe(s));
  }

  // ---------- Hero role rotator ----------
  const rotator = document.getElementById('rotator');
  const roles = ['Front-End Developer', 'UI Enthusiast', 'CS Undergrad'];
  let roleIndex = 0;

  if (rotator && !reduceMotion) {
    setInterval(() => {
      roleIndex = (roleIndex + 1) % roles.length;
      rotator.style.opacity = '0';
      setTimeout(() => {
        rotator.textContent = roles[roleIndex];
        rotator.style.opacity = '1';
      }, 250);
    }, 3000);
    rotator.style.transition = 'opacity 0.25s ease';
  }

  // ---------- Stat counters ----------
  const stats = $$('.stat-num[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1200;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); statObs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    stats.forEach((s) => statObs.observe(s));
  } else stats.forEach(animateCount);

  // ---------- Project filters ----------
  const filters = $$('.filter');
  const cards = $$('.project-card');
  const filterEmpty = document.getElementById('filter-empty');

  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      filters.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      const f = btn.dataset.filter;
      let shown = 0;
      cards.forEach((card) => {
        const match = f === 'all' || card.dataset.tags.split(' ').includes(f);
        card.classList.toggle('hide', !match);
        if (match) shown++;
      });
      if (filterEmpty) filterEmpty.hidden = shown > 0;
    });
  });

  // ---------- Card tilt ----------
  if (finePointer && !reduceMotion) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
        card.style.setProperty('--lift', '-6px');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--lift', '0px');
      });
    });
  }

  // ---------- Ripple ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.ripple');
    if (!el || reduceMotion) return;
    const r = el.getBoundingClientRect();
    const ink = document.createElement('span');
    ink.className = 'ripple-ink';
    const size = Math.max(r.width, r.height) * 2.2;
    ink.style.width = ink.style.height = size + 'px';
    ink.style.left = (e.clientX - r.left) + 'px';
    ink.style.top = (e.clientY - r.top) + 'px';
    el.appendChild(ink);
    setTimeout(() => ink.remove(), 650);
  });

  // ---------- Content data ----------
  const PROJECTS = {
    weather: {
      title: 'Weather Now',
      emoji: '⛅',
      visual: 'linear-gradient(135deg, #1E3A8A, #0D9488)',
      desc: 'A weather lookup app built while learning how the web talks to servers. Search any city and get current conditions straight from a live API.',
      features: [
        'City search with live data from a public weather API',
        'Current temperature, conditions, humidity and wind',
        'Loading and error states — no spinner-forever screens',
        'Responsive layout that works on phones first',
        'Debounced search so the API isn\'t hammered'
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'Fetch API', 'Async/Await'],
      links: [{ label: 'Source code', href: 'https://github.com/' }]
    },
    task: {
      title: 'Task Board',
      emoji: '✔',
      visual: 'linear-gradient(135deg, #9D174D, #E11D48)',
      desc: 'A drag-and-drop to-do board with three columns — To Do, Doing, Done. Built to practice state management and persistence without any framework.',
      features: [
        'Drag tasks between three columns',
        'Add, complete and delete tasks',
        'Everything persists in localStorage between visits',
        'Empty-state messaging per column',
        'Mobile-friendly touch drag'
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'LocalStorage', 'Drag & Drop API'],
      links: [{ label: 'Source code', href: 'https://github.com/' }]
    },
    pomo: {
      title: 'Pomodoro Focus',
      emoji: '⏱',
      visual: 'linear-gradient(135deg, #92400E, #F59E0B)',
      desc: 'A focus timer using the Pomodoro technique — work intervals, short breaks, long breaks, and a running count of finished sessions.',
      features: [
        '25/5 work-break cycles with a long break every 4 sessions',
        'Session counter and progress ring',
        'Start, pause and reset controls',
        'Page title updates with the remaining time',
        'Notification when a session ends'
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'Timers', 'State'],
      links: [{ label: 'Source code', href: 'https://github.com/' }]
    },
    quiz: {
      title: 'Quiz App',
      emoji: '?',
      visual: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
      desc: 'A timed multiple-choice quiz with instant scoring and a results screen — good practice in DOM manipulation, arrays and conditional logic.',
      features: [
        '10 questions with a countdown timer',
        'Instant right/wrong feedback per answer',
        'Results screen with score breakdown',
        'Shuffled options so it\'s different every run',
        'Restart without refreshing the page'
      ],
      stack: ['HTML', 'CSS', 'JavaScript', 'DOM'],
      links: [{ label: 'Source code', href: 'https://github.com/' }]
    }
  };

  const POSTS = [
    {
      id: 'semantic-html',
      title: 'Semantic HTML is a feature, not a chore',
      date: '2026-08-12',
      read: '4 min',
      tag: 'HTML',
      body: `Before writing CSS I learned to stop thinking in *divs* and start thinking in **meaning**. A heading is a heading. A list is a list. A button is a button.

## Why it matters

Screen readers navigate by landmarks and headings, not by how your box model looks. Search engines do the same thing. Choosing \`<button>\` over a styled \`<div>\` gets you keyboard support for free.

## My checklist

- One \`<h1>\` per page, no skipped heading levels
- \`<nav>\`, \`<main>\`, \`<section>\` and \`<footer>\` instead of wrapper divs
- Real buttons for actions, real links for navigation
- Images get \`alt\` text, decorative ones get \`aria-hidden\`

## The payoff

My last project needed **zero** extra accessibility code. The markup did the work — the CSS only had to make it look good.

> Clean markup is the cheapest accessibility win you will ever get.`
    },
    {
      id: 'four-projects',
      title: 'What building 4 small apps taught me',
      date: '2026-09-03',
      read: '5 min',
      tag: 'JavaScript',
      body: `I shipped four small apps this year: a weather lookup, a task board, a focus timer and a quiz. None are big — all of them taught me something.

## 1. The Fetch API is 90% error handling

Getting data is one line. Handling a slow network, a typo'd city and a rate limit is the actual job. Now I always write the failure path first.

## 2. State is just variables with discipline

The task board broke until I stopped mutating the DOM directly and started re-rendering from a single array. One source of truth, one render function.

## 3. \`localStorage\` is deceptively simple

It only stores strings. JSON round-tripping (\`JSON.stringify\` / \`JSON.parse\`) plus a \`try/catch\` for corrupted data saved me twice.

## 4. Timers lie

\`setInterval\` drifts. For the Pomodoro timer I now compare \`Date.now()\` against a target timestamp instead of counting ticks.

> Small projects compound. Four tiny apps taught me more than one big tutorial.`
    },
    {
      id: 'grid-vs-flexbox',
      title: 'CSS Grid vs Flexbox — my cheat sheet',
      date: '2026-09-21',
      read: '3 min',
      tag: 'CSS',
      body: `I used to reach for Flexbox every time and then fight it. Here is the rule I now follow.

## Use Flexbox when...

You are laying out items in **one direction** — a row or a column.

- Navigation bars
- Button groups
- Centering one thing (the classic \`margin: auto\` trick)
- Letting items size to their content

## Use Grid when...

You are defining a **two-dimensional** layout — rows *and* columns.

- Page skeletons (sidebar + main)
- Card grids
- The bento-style hero on this site
- Overlapping elements with \`grid-area\`

## The one-liner

**Flexbox distributes space. Grid places things.**

## They play together

My project grid is CSS Grid, but each card's internals are Flexbox. Grid decides *where the card goes*; Flex decides *how its contents flow*.

\`\`\`css
.project-grid { display: grid; gap: 1.5rem; }
.project-body { display: flex; flex-direction: column; }
\`\`\`

Stop choosing sides — pick the right tool per layer.`
    }
  ];

  // ---------- Markdown mini-parser ----------
  function inlineMd(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function renderMd(src) {
    const blocks = src.trim().split(/\n{2,}/);
    return blocks.map((b) => {
      b = b.trim();
      if (b.startsWith('## ')) return `<h4>${inlineMd(b.slice(3))}</h4>`;
      if (b.startsWith('> ')) return `<blockquote>${inlineMd(b.slice(2))}</blockquote>`;
      if (b.startsWith('- ')) {
        return '<ul>' + b.split('\n').map((l) => `<li>${inlineMd(l.replace(/^- /, ''))}</li>`).join('') + '</ul>';
      }
      if (b.startsWith('```')) {
        const code = b.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
        return `<pre><code>${esc(code)}</code></pre>`;
      }
      return `<p>${inlineMd(b).replace(/\n/g, '<br>')}</p>`;
    }).join('');
  }

  // ---------- Blog ----------
  const blogGrid = document.getElementById('blog-grid');
  const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  if (blogGrid) {
    blogGrid.innerHTML = POSTS.map((p) => {
      const plain = p.body.replace(/[#*`>\-\[\]()]/g, '').replace(/\s+/g, ' ').trim();
      const excerpt = plain.slice(0, 130).trim() + '…';
      return `
        <article class="blog-card reveal" role="button" tabindex="0" data-post="${p.id}" aria-label="Read: ${esc(p.title)}">
          <div class="blog-meta"><span class="blog-tag">${esc(p.tag)}</span><time datetime="${p.date}">${fmtDate(p.date)} · ${p.read}</time></div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(excerpt)}</p>
          <span class="proj-more">Read more <span aria-hidden="true">↗</span></span>
        </article>`;
    }).join('');
    $$('.blog-card', blogGrid).forEach((el) => {
      if (!reduceMotion && 'IntersectionObserver' in window) {
        const o = new IntersectionObserver((entries) => {
          entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } });
        }, { threshold: 0.12 });
        o.observe(el);
      } else el.classList.add('visible');
    });
  }

  // ---------- Modal ----------
  const modal = document.getElementById('modal');
  const modalVisual = document.getElementById('modal-visual');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  let lastFocus = null;

  function openModal(visual, html) {
    lastFocus = document.activeElement;
    modalVisual.style.background = visual;
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
    document.addEventListener('keydown', modalKeys);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', modalKeys);
    if (lastFocus) lastFocus.focus();
  }
  function modalKeys(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      const f = $$('a[href], button, [tabindex]:not([tabindex="-1"])', modal).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  modalClose.addEventListener('click', closeModal);
  $('[data-close]', modal).addEventListener('click', closeModal);

  function openProject(id) {
    const p = PROJECTS[id];
    if (!p) return;
    const html = `
      <h2 id="modal-title">${esc(p.title)}</h2>
      <p>${esc(p.desc)}</p>
      <h3>Features</h3>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <h3>Built with</h3>
      <ul class="tags">${p.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <div class="modal-links">${p.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>`;
    openModal(p.visual, html);
  }

  function openPost(id) {
    const p = POSTS.find((x) => x.id === id);
    if (!p) return;
    const html = `
      <div class="blog-meta"><span class="blog-tag">${esc(p.tag)}</span><time datetime="${p.date}">${fmtDate(p.date)} · ${p.read} read</time></div>
      <h2 id="modal-title">${esc(p.title)}</h2>
      ${renderMd(p.body)}`;
    openModal('linear-gradient(135deg, #0D9488, #1E3A8A)', html);
  }

  cards.forEach((card) => {
    const activate = () => openProject(card.dataset.project);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  if (blogGrid) {
    blogGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.blog-card');
      if (card) openPost(card.dataset.post);
    });
    blogGrid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.blog-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPost(card.dataset.post); }
    });
  }

  // ---------- GitHub repos ----------
  const reposBox = document.getElementById('repos');
  const LANG_COLORS = {
    JavaScript: '#F1E05A', TypeScript: '#3178C6', HTML: '#E34C26', CSS: '#563D7C',
    Python: '#3572A5', Java: '#B07219', C: '#555555', 'C++': '#F34B7D'
  };

  async function loadRepos() {
    if (!reposBox) return;
    if (!GITHUB_USER) {
      reposBox.innerHTML = '<p class="repos-note">Add your GitHub username (<code>GITHUB_USER</code>) at the top of <code>script.js</code> to show live repositories here.</p>';
      return;
    }
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/repos?sort=updated&per_page=6`);
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) throw new Error('empty');
      reposBox.innerHTML = data.slice(0, 6).map((r) => `
        <a class="repo" href="${r.html_url}" target="_blank" rel="noopener">
          <h4>${esc(r.name)}</h4>
          <p>${esc(r.description || 'No description yet.')}</p>
          <div class="repo-meta">
            <i style="background:${LANG_COLORS[r.language] || '#8B949E'}"></i>
            ${esc(r.language || 'Other')} · ★ ${r.stargazers_count} · updated ${new Date(r.pushed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </a>`).join('');
    } catch (err) {
      reposBox.innerHTML = '<p class="repos-note">Couldn\'t load repositories right now — check the username or try again later.</p>';
    }
  }
  loadRepos();

  // ---------- Contact form ----------
  const form = document.getElementById('contact-form');
  const note = document.getElementById('form-note');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const els = form.elements;
    const name = (els['name'].value || '').trim();
    const email = (els['email'].value || '').trim();
    const message = (els['message'].value || '').trim();
    const honeypot = (els['website'].value || '').trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    [[els['name'], !name], [els['email'], !emailOk], [els['message'], !message]].forEach(([field, bad]) =>
      field.classList.toggle('invalid', bad)
    );

    if (honeypot) {
      note.textContent = 'Thanks — message sent!';
      note.classList.remove('error');
      form.reset();
      return;
    }
    if (!name || !emailOk || !message) {
      note.textContent = 'Please fill in all fields with a valid email.';
      note.classList.add('error');
      return;
    }

    if (FORM_ENDPOINT) {
      note.textContent = 'Sending…';
      note.classList.remove('error');
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });
        if (!res.ok) throw new Error('failed');
        note.textContent = 'Message sent — I\'ll reply soon!';
        form.reset();
      } catch (err) {
        note.textContent = 'Something went wrong. Email me directly instead?';
        note.classList.add('error');
      }
      return;
    }

    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:saitejag562@gmail.com?subject=${subject}&body=${body}`;
    note.textContent = 'Opening your email app…';
    note.classList.remove('error');
    form.reset();
  });

  // ---------- Footer year ----------
  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Service worker ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname))) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
