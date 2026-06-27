(function () {
  'use strict';

  const PASSWORD_HASH = 'aa78977914bca30f3804357e1a7c16298218f82c82a199cb7bb6034062cdd6a3';
  const SESSION_KEY = 'af-admin-session-v1';
  const STATE_KEY = 'af-admin-demo-state-v1';
  const SCRIPT_URL = new URL((document.currentScript && document.currentScript.src) || window.location.href);
  const SITE_ROOT_URL = new URL('../../', SCRIPT_URL);
  const DATA_URL = new URL('../data/admin-dashboard.json', SCRIPT_URL).href;

  const NAV_SECTIONS = [
    {
      title: 'Command',
      items: [{ id: 'overview', label: 'Command Center', hint: 'Metrics, planner, quick modules' }]
    },
    {
      title: 'Website',
      items: [
        { id: 'content', label: 'Visual editor', hint: 'Hero copy, CTAs, preview' },
        { id: 'pages', label: 'Page board', hint: '29 pages · procedure landings' }
      ]
    },
    {
      title: 'Growth',
      items: [
        { id: 'seo', label: 'Search Console', hint: 'Query opportunities' },
        { id: 'referrals', label: 'Referral CRM', hint: 'B2B partners · med spas · derm' },
        { id: 'mailbox', label: 'Outreach inbox', hint: 'Sent & queued emails' },
        { id: 'leads', label: 'Lead log', hint: 'Consult forms & calls' }
      ]
    },
    {
      title: 'Reputation',
      items: [
        { id: 'reviews', label: 'Reviews', hint: 'Reply drafts & requests' },
        { id: 'gbp', label: 'Business Profile', hint: 'Dual-location GBP ops' },
        { id: 'campaigns', label: 'Campaigns', hint: 'Social & GBP posts' }
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'compliance', label: 'Approvals', hint: 'Sign-off queue' },
        { id: 'exports', label: 'Backup / export', hint: 'Save demo workspace' },
        { id: 'help', label: 'Guide', hint: 'Module reference' }
      ]
    }
  ];
  const navItems = NAV_SECTIONS.flatMap(s => s.items);

  const app = document.getElementById('admin-app');
  const login = document.getElementById('admin-login');
  const loginForm = document.getElementById('admin-login-form');
  const loginInput = document.getElementById('admin-password');
  const loginMessage = document.getElementById('admin-login-message');
  const main = document.getElementById('admin-main');
  const nav = document.getElementById('admin-nav');
  const viewTitle = document.getElementById('view-title');
  const viewKicker = document.getElementById('view-kicker');
  const toastEl = document.getElementById('toast');
  const logoutButton = document.getElementById('logout-button');
  const exportButton = document.getElementById('export-button');
  const navToggle = document.getElementById('nav-toggle');

  let state = null;
  let currentView = 'overview';
  let referralTab = 'pipeline';
  let selectedReferralId = null;
  let filters = { pageSearch: '', pageCategory: 'All', referralGroup: 'All', referralStatus: 'All', leadStatus: 'All' };
  let toastTimer = null;

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function attr(v) { return escapeHtml(v).replace(/`/g, '&#96;'); }

  async function sha256(value) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  }

  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
  }

  function loadStoredState(base) {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return structuredClone(base);
      const stored = JSON.parse(raw);
      return { ...structuredClone(base), ...stored, content: { ...base.content, ...(stored.content || {}) } };
    } catch (_) {
      return structuredClone(base);
    }
  }

  function statusClass(status) {
    const s = String(status || '').toLowerCase();
    if (/new|to contact/.test(s)) return 'status-pill--new';
    if (/active|live|scheduled|sent|replied|approved/.test(s)) return 'status-pill--active';
    if (/nurture|follow/.test(s)) return 'status-pill--nurture';
    if (/draft/.test(s)) return 'status-pill--draft';
    if (/contacted|contact/.test(s)) return 'status-pill--contact';
    if (/research|pending/.test(s)) return 'status-pill--research';
    return 'status-pill--research';
  }

  function renderNav() {
    nav.innerHTML = NAV_SECTIONS.map((section, i) => `
      <p class="nav-section-title${i ? ' nav-section-title--spaced' : ''}">${escapeHtml(section.title)}</p>
      ${section.items.map(item => `
        <button type="button" class="nav-button${currentView === item.id ? ' is-active' : ''}" data-view="${attr(item.id)}">
          <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.hint)}</small></span>
        </button>
      `).join('')}
    `).join('');
  }

  function setView(id) {
    currentView = id;
    const item = navItems.find(n => n.id === id) || navItems[0];
    viewTitle.textContent = item.label;
    viewKicker.textContent = state.site.name;
    renderNav();
    renderView();
    document.body.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    main.focus({ preventScroll: true });
  }

  function renderMetrics() {
    return `<div class="metric-grid">${state.metrics.map(m => `
      <article class="metric-card">
        <span>${escapeHtml(m.label)}</span>
        <strong>${escapeHtml(m.value)}</strong>
        <em class="${m.tone === 'up' ? 'is-up' : m.tone === 'down' ? 'is-down' : ''}">${escapeHtml(m.delta)}</em>
      </article>
    `).join('')}</div>`;
  }

  function renderOverview() {
    const modules = [
      { view: 'content', title: 'Visual Editor', desc: 'Edit homepage hero, CTAs, and preview live.', action: 'Open editor' },
      { view: 'referrals', title: 'Referral CRM', desc: 'Track med spas, dermatologists, and PCP partners.', action: 'Open CRM' },
      { view: 'leads', title: 'Lead Log', desc: '47 consult requests this month — 3 new today.', action: 'View leads' },
      { view: 'reviews', title: 'Reviews', desc: '4.9★ · draft replies for new Google reviews.', action: 'Open reviews' }
    ];
    return `
      ${renderMetrics()}
      <div class="panel-grid panel-grid--2">
        <section class="panel">
          <div class="panel-head"><h2>Today's planner</h2><span class="status-pill status-pill--pending">Demo</span></div>
          <div class="panel-body">
            <ul class="planner-list">
              ${state.todayPlanner.map(p => `
                <li class="planner-item">
                  <span class="planner-time">${escapeHtml(p.time)}</span>
                  <div>
                    <p class="planner-task">${escapeHtml(p.task)}</p>
                    <p class="planner-meta">${escapeHtml(p.priority)} priority · ${escapeHtml(p.module)}</p>
                  </div>
                  <button type="button" class="button button-secondary" data-goto="${attr(p.module)}">Open</button>
                </li>
              `).join('')}
            </ul>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Quick modules</h2></div>
          <div class="panel-body">
            <div class="module-cards">
              ${modules.map(m => `
                <article class="module-card">
                  <h3>${escapeHtml(m.title)}</h3>
                  <p>${escapeHtml(m.desc)}</p>
                  <button type="button" class="button button-primary" data-goto="${attr(m.view)}">${escapeHtml(m.action)}</button>
                </article>
              `).join('')}
            </div>
          </div>
        </section>
      </div>
      <section class="panel" style="margin-top:16px">
        <div class="panel-head"><h2>Practice snapshot</h2></div>
        <div class="panel-body">
          <p><strong>${escapeHtml(state.site.doctor)}</strong> · ${escapeHtml(state.site.patientCount)} patients · ${state.site.locationCount} locations (Safety Harbor & Tampa)</p>
          <p style="color:var(--admin-muted);margin:8px 0 0">${state.site.procedureCount} procedure pages · ${state.site.pageCount} total public pages · Phone ${escapeHtml(state.site.phoneDisplay)}</p>
        </div>
      </section>
    `;
  }

  function renderContent() {
    const c = state.content;
    return `
      <div class="editor-layout">
        <aside class="editor-sidebar panel">
          <div class="panel-head"><h2>Homepage hero</h2></div>
          <div class="panel-body">
            <form id="content-form">
              <div class="field-group"><label for="hero-eyebrow">Eyebrow</label><input class="field" id="hero-eyebrow" name="heroEyebrow" value="${attr(c.heroEyebrow)}"></div>
              <div class="field-group"><label for="hero-title">Headline</label><input class="field" id="hero-title" name="heroTitle" value="${attr(c.heroTitle)}"></div>
              <div class="field-group"><label for="hero-lead">Lead paragraph</label><textarea class="field" id="hero-lead" name="heroLead">${escapeHtml(c.heroLead)}</textarea></div>
              <div class="field-group"><label for="hero-cta">Primary CTA</label><input class="field" id="hero-cta" name="heroCtaPrimary" value="${attr(c.heroCtaPrimary)}"></div>
              <div class="field-group"><label for="hero-phone">Phone CTA</label><input class="field" id="hero-phone" name="heroCtaPhone" value="${attr(c.heroCtaPhone)}"></div>
              <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
                <button type="submit" class="button button-primary">Save draft</button>
                <button type="button" class="button button-secondary" id="publish-demo">Queue for approval</button>
              </div>
            </form>
            <p style="margin-top:12px;font-size:0.82rem;color:var(--admin-muted)">Drafts save to this browser. Production site is unchanged in demo mode.</p>
          </div>
        </aside>
        <div class="editor-preview panel">
          <div class="panel-head"><h2>Live preview</h2><a class="button button-secondary" href="${attr(SITE_ROOT_URL.href)}" target="_blank" rel="noopener">Open site</a></div>
          <iframe title="Art Form homepage preview" src="${attr(SITE_ROOT_URL.href)}" loading="lazy"></iframe>
        </div>
      </div>
    `;
  }

  function renderPages() {
    const q = filters.pageSearch.toLowerCase();
    const rows = state.servicePages.filter(p => {
      if (filters.pageCategory !== 'All' && p.category !== filters.pageCategory) return false;
      if (q && !(`${p.title} ${p.path}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const categories = ['All', ...new Set(state.servicePages.map(p => p.category))];
    return `
      <div class="toolbar">
        <input class="field" type="search" placeholder="Search pages…" data-filter="pageSearch" value="${attr(filters.pageSearch)}">
        <select class="select" data-filter="pageCategory">${categories.map(c => `<option${filters.pageCategory === c ? ' selected' : ''}>${escapeHtml(c)}</option>`).join('')}</select>
        <span style="color:var(--admin-muted);font-size:0.84rem">${rows.length} of ${state.site.pageCount} pages shown</span>
      </div>
      <section class="panel">
        <div class="panel-body panel-body--flush">
          <table class="data-table">
            <thead><tr><th>Page</th><th>Category</th><th>SEO</th><th>Status</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              ${rows.map(p => `
                <tr>
                  <td><strong>${escapeHtml(p.title)}</strong><br><small style="color:var(--admin-muted)">${escapeHtml(p.path)}</small></td>
                  <td>${escapeHtml(p.category)}</td>
                  <td><span class="score-bar"><span style="width:${p.seoScore}%"></span></span>${p.seoScore}</td>
                  <td><span class="status-pill ${statusClass(p.status)}">${escapeHtml(p.status)}</span></td>
                  <td>${escapeHtml(p.lastEdited)}</td>
                  <td><a class="button button-secondary" href="${attr(new URL(p.path.replace(/^\//, ''), SITE_ROOT_URL).href)}" target="_blank" rel="noopener">View</a></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function referralCounts() {
    const counts = { Research: 0, 'To Contact': 0, Contacted: 0, 'Draft Email': 0, Nurture: 0, 'Active Partner': 0 };
    state.referrals.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }

  function renderReferrals() {
    const counts = referralCounts();
    const stages = ['Research', 'To Contact', 'Contacted', 'Nurture', 'Active Partner'];
    const groups = ['All', ...new Set(state.referrals.map(r => r.group))];
    const filtered = state.referrals.filter(r => {
      if (filters.referralGroup !== 'All' && r.group !== filters.referralGroup) return false;
      if (filters.referralStatus !== 'All' && r.status !== filters.referralStatus) return false;
      return true;
    });
    const selected = state.referrals.find(r => r.id === selectedReferralId) || filtered[0] || null;
    if (selected) selectedReferralId = selected.id;

    return `
      <div class="crm-tabs">
        ${['pipeline', 'find', 'packages'].map(t => `
          <button type="button" class="tab-button${referralTab === t ? ' is-active' : ''}" data-referral-tab="${t}">${t === 'pipeline' ? 'Pipeline' : t === 'find' ? 'Find partners' : 'Partner kits'}</button>
        `).join('')}
      </div>
      ${referralTab === 'pipeline' ? `
        <div class="crm-flow">
          ${stages.map(s => `<div class="crm-stage"><strong>${counts[s] || 0}</strong><span>${escapeHtml(s)}</span></div>`).join('')}
        </div>
        <div class="toolbar">
          <select class="select" data-filter="referralGroup">${groups.map(g => `<option${filters.referralGroup === g ? ' selected' : ''}>${escapeHtml(g)}</option>`).join('')}</select>
          <select class="select" data-filter="referralStatus"><option>All</option>${stages.concat(['Draft Email']).map(s => `<option${filters.referralStatus === s ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select>
          <button type="button" class="button button-primary" id="add-referral-demo">Add prospect</button>
        </div>
        <div class="panel-grid panel-grid--2">
          <section class="panel">
            <div class="panel-head"><h2>Partner pipeline (${filtered.length})</h2></div>
            <div class="panel-body panel-body--flush">
              <table class="data-table">
                <thead><tr><th>Business</th><th>Group</th><th>Status</th><th>Refs</th></tr></thead>
                <tbody>
                  ${filtered.map(r => `
                    <tr data-select-referral="${attr(r.id)}" style="cursor:pointer">
                      <td><strong>${escapeHtml(r.business)}</strong><br><small>${escapeHtml(r.city)}</small></td>
                      <td>${escapeHtml(r.group)}</td>
                      <td><span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span></td>
                      <td>${r.referralsSent || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-head"><h2>Partner detail</h2></div>
            <div class="panel-body">
              ${selected ? `
                <div class="detail-card">
                  <h3>${escapeHtml(selected.business)}</h3>
                  <p>${escapeHtml(selected.angle)}</p>
                  <dl>
                    <dt>Contact</dt><dd>${escapeHtml(selected.contactName || '—')}</dd>
                    <dt>Email</dt><dd>${escapeHtml(selected.contactEmail || '—')}</dd>
                    <dt>Last touch</dt><dd>${escapeHtml(selected.lastTouch)}</dd>
                    <dt>Next step</dt><dd>${escapeHtml(selected.nextStep)}</dd>
                  </dl>
                  <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                    <button type="button" class="button button-primary" data-advance-referral="${attr(selected.id)}">Advance stage</button>
                    <button type="button" class="button button-secondary" data-draft-email="${attr(selected.id)}">Draft email</button>
                  </div>
                </div>
              ` : '<p class="empty-note">No partners match filters.</p>'}
            </div>
          </section>
        </div>
      ` : ''}
      ${referralTab === 'find' ? `
        <section class="panel">
          <div class="panel-head"><h2>Find B2B referral targets</h2></div>
          <div class="panel-body">
            <p style="margin-top:0;color:var(--admin-muted)">Suggested partner types for facial plastic surgery in Tampa Bay:</p>
            <div class="module-cards">
              ${['Med spas', 'Dermatologists', 'Primary care', 'Dental / oral surgery', 'Wedding planners'].map(g => `
                <article class="module-card">
                  <h3>${escapeHtml(g)}</h3>
                  <p>${(state.referralPackages[g] || []).join(' · ')}</p>
                  <button type="button" class="button button-secondary" data-find-group="${attr(g)}">Search demo list</button>
                </article>
              `).join('')}
            </div>
          </div>
        </section>
      ` : ''}
      ${referralTab === 'packages' ? `
        <section class="panel">
          <div class="panel-head"><h2>Co-branded partner kits</h2></div>
          <div class="panel-body panel-body--flush">
            <table class="data-table">
              <thead><tr><th>Partner type</th><th>Included assets</th><th></th></tr></thead>
              <tbody>
                ${Object.entries(state.referralPackages).map(([group, items]) => `
                  <tr>
                    <td><strong>${escapeHtml(group)}</strong></td>
                    <td>${items.map(i => escapeHtml(i)).join('<br>')}</td>
                    <td><button type="button" class="button button-secondary" data-generate-kit="${attr(group)}">Generate PDF (demo)</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      ` : ''}
    `;
  }

  function renderMailbox() {
    return `
      <section class="panel">
        <div class="panel-head"><h2>Outreach inbox</h2><button type="button" class="button button-primary" id="compose-demo">Compose</button></div>
        <div class="panel-body panel-body--flush">
          <table class="data-table">
            <thead><tr><th>Status</th><th>To</th><th>Subject</th><th>Preview</th><th></th></tr></thead>
            <tbody>
              ${state.mailbox.map(m => `
                <tr>
                  <td><span class="status-pill ${statusClass(m.status)}">${escapeHtml(m.status)}</span></td>
                  <td>${escapeHtml(m.to)}</td>
                  <td>${escapeHtml(m.subject)}</td>
                  <td style="max-width:280px;color:var(--admin-muted)">${escapeHtml(m.preview)}</td>
                  <td><button type="button" class="button button-secondary" data-send-mail="${attr(m.id)}">${m.status === 'Sent' ? 'View' : 'Send (demo)'}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderLeads() {
    const statuses = ['All', ...new Set(state.leads.map(l => l.status))];
    const rows = state.leads.filter(l => filters.leadStatus === 'All' || l.status === filters.leadStatus);
    return `
      <div class="toolbar">
        <select class="select" data-filter="leadStatus">${statuses.map(s => `<option${filters.leadStatus === s ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select>
        <span class="status-pill status-pill--new">${rows.filter(l => l.status === 'New').length} new</span>
      </div>
      <section class="panel">
        <div class="panel-head"><h2>Consult lead log</h2></div>
        <div class="panel-body panel-body--flush">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Lead</th><th>Procedure</th><th>Source</th><th>Status</th><th>Received</th><th></th></tr></thead>
            <tbody>
              ${rows.map(l => `
                <tr>
                  <td>${escapeHtml(l.id)}</td>
                  <td><strong>${escapeHtml(l.name)}</strong><br><small>${escapeHtml(l.location)}</small></td>
                  <td>${escapeHtml(l.procedure)}</td>
                  <td>${escapeHtml(l.source)}</td>
                  <td><span class="status-pill ${statusClass(l.status)}">${escapeHtml(l.status)}</span></td>
                  <td>${escapeHtml(l.received)}</td>
                  <td><button type="button" class="button button-secondary" data-lead-action="${attr(l.id)}">${l.status === 'New' ? 'Mark contacted' : 'View notes'}</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderSeo() {
    return `
      ${renderMetrics()}
      <section class="panel">
        <div class="panel-head"><h2>Search opportunities (GSC sample)</h2></div>
        <div class="panel-body panel-body--flush">
          <table class="data-table">
            <thead><tr><th>Query</th><th>Impressions</th><th>Avg position</th><th>Recommended action</th><th></th></tr></thead>
            <tbody>
              ${state.seoOpportunities.map(o => `
                <tr>
                  <td><strong>${escapeHtml(o.query)}</strong></td>
                  <td>${o.impressions.toLocaleString()}</td>
                  <td>${o.position}</td>
                  <td>${escapeHtml(o.action)}</td>
                  <td><button type="button" class="button button-secondary" data-seo-task="${attr(o.query)}">Add to planner</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderReviews() {
    return `
      <div class="panel-grid panel-grid--2">
        <section class="panel">
          <div class="panel-head"><h2>Recent reviews</h2><a class="button button-secondary" href="${attr(state.site.googleReviewUrl)}" target="_blank" rel="noopener">Review link</a></div>
          <div class="panel-body panel-body--flush">
            ${state.reviews.map(r => `
              <article class="review-card">
                <div class="review-head">
                  <div><strong>${escapeHtml(r.author)}</strong> · ${escapeHtml(r.source)}<div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div></div>
                  <span class="status-pill ${statusClass(r.status)}">${escapeHtml(r.status)}</span>
                </div>
                <p>${escapeHtml(r.snippet)}</p>
                ${state.reviewDrafts[r.id] ? `<textarea class="field" data-review-draft="${attr(r.id)}">${escapeHtml(state.reviewDrafts[r.id])}</textarea>` : ''}
                <button type="button" class="button button-primary" style="margin-top:8px" data-post-review="${attr(r.id)}">Post reply (demo)</button>
              </article>
            `).join('')}
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Review ops</h2></div>
          <div class="panel-body">
            <p><strong>4.9</strong> average · 127 Google reviews indexed</p>
            <ul class="checklist" style="margin-top:14px">
              <li><input type="checkbox" checked disabled> Review request link on thank-you page</li>
              <li><input type="checkbox" checked disabled> Auto-alert for new 4★ or below</li>
              <li><input type="checkbox"> SMS review request after consult (demo off)</li>
            </ul>
          </div>
        </section>
      </div>
    `;
  }

  function renderGbp() {
    return `
      <div class="panel-grid panel-grid--2">
        <section class="panel">
          <div class="panel-head"><h2>Locations</h2></div>
          <div class="panel-body panel-body--flush">
            <table class="data-table">
              <thead><tr><th>Location</th><th>Status</th><th>Views 30d</th><th>Actions</th><th>Photos</th></tr></thead>
              <tbody>
                ${state.gbp.locations.map(l => `
                  <tr>
                    <td><strong>${escapeHtml(l.name)}</strong></td>
                    <td><span class="status-pill status-pill--active">${escapeHtml(l.status)}</span></td>
                    <td>${l.views30d.toLocaleString()}</td>
                    <td>${l.actions30d}</td>
                    <td>${l.photoCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>GBP checklist</h2></div>
          <div class="panel-body">
            <ul class="checklist">
              ${state.gbp.checklist.map((item, i) => `
                <li><input type="checkbox" id="gbp-${i}" data-gbp-check="${i}"${item.done ? ' checked' : ''}><label for="gbp-${i}">${escapeHtml(item.item)}</label></li>
              `).join('')}
            </ul>
            <div class="field-group" style="margin-top:16px"><label>Post draft</label>
              <input class="field" value="${attr(state.gbp.postDraft.title)}" readonly>
              <textarea class="field" style="margin-top:8px" readonly>${escapeHtml(state.gbp.postDraft.body)}</textarea>
              <button type="button" class="button button-primary" id="publish-gbp">Schedule post (demo)</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function renderCampaigns() {
    return `
      <section class="panel">
        <div class="panel-head"><h2>Campaign queue</h2><button type="button" class="button button-primary" id="new-campaign">New draft</button></div>
        <div class="panel-body panel-body--flush">
          <table class="data-table">
            <thead><tr><th>Channel</th><th>Title</th><th>Status</th><th>Publish</th><th>Caption</th></tr></thead>
            <tbody>
              ${state.campaigns.map(c => `
                <tr>
                  <td>${escapeHtml(c.channel)}</td>
                  <td><strong>${escapeHtml(c.title)}</strong></td>
                  <td><span class="status-pill ${statusClass(c.status)}">${escapeHtml(c.status)}</span></td>
                  <td>${escapeHtml(c.publishDate)}</td>
                  <td style="max-width:260px;color:var(--admin-muted)">${escapeHtml(c.caption)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderCompliance() {
    return `
      <section class="panel">
        <div class="panel-head"><h2>Approval queue</h2></div>
        <div class="panel-body panel-body--flush">
          <table class="data-table">
            <thead><tr><th>Item</th><th>Requested by</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${state.approvals.map(a => `
                <tr>
                  <td>${escapeHtml(a.item)}</td>
                  <td>${escapeHtml(a.requestedBy)}</td>
                  <td><span class="status-pill ${statusClass(a.status)}">${escapeHtml(a.status)}</span></td>
                  <td><button type="button" class="button button-secondary" data-approve="${attr(a.id)}">Approve (demo)</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel" style="margin-top:16px">
        <div class="panel-head"><h2>Guardrails</h2></div>
        <div class="panel-body"><ul class="guardrail-list">${state.complianceGuardrails.map(g => `<li>${escapeHtml(g)}</li>`).join('')}</ul></div>
      </section>
    `;
  }

  function renderExports() {
    const blob = JSON.stringify(state, null, 2);
    return `
      <div class="panel-grid panel-grid--2">
        <section class="panel">
          <div class="panel-head"><h2>Export workspace</h2></div>
          <div class="panel-body">
            <p style="margin-top:0;color:var(--admin-muted)">Download demo CRM, content drafts, and checklist state.</p>
            <button type="button" class="button button-primary" id="download-export">Download JSON</button>
            <button type="button" class="button button-secondary" id="reset-demo" style="margin-left:8px">Reset demo data</button>
          </div>
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Import workspace</h2></div>
          <div class="panel-body">
            <input type="file" id="import-file" accept="application/json,.json">
            <p style="font-size:0.84rem;color:var(--admin-muted);margin-top:10px">Merge imported JSON into this browser's demo state.</p>
          </div>
        </section>
      </div>
      <section class="panel" style="margin-top:16px">
        <div class="panel-head"><h2>Current state preview</h2></div>
        <div class="panel-body"><div class="export-box"><code>${escapeHtml(blob.slice(0, 1200))}${blob.length > 1200 ? '…' : ''}</code></div></div>
      </section>
    `;
  }

  function renderHelp() {
    return `
      <section class="panel">
        <div class="panel-head"><h2>Art Form Command — module guide</h2></div>
        <div class="panel-body">
          <div class="module-cards">
            ${navItems.map(n => `
              <article class="module-card">
                <h3>${escapeHtml(n.label)}</h3>
                <p>${escapeHtml(n.hint)}</p>
                <button type="button" class="button button-secondary" data-goto="${attr(n.id)}">Open</button>
              </article>
            `).join('')}
          </div>
          <p style="margin-top:20px;color:var(--admin-muted);font-size:0.88rem">This is a static demo dashboard. Password gates access in the browser; data persists in localStorage only. For production, wire to a secure backend and real CRM/email APIs.</p>
        </div>
      </section>
    `;
  }

  const viewRenderers = {
    overview: renderOverview,
    content: renderContent,
    pages: renderPages,
    seo: renderSeo,
    referrals: renderReferrals,
    mailbox: renderMailbox,
    leads: renderLeads,
    reviews: renderReviews,
    gbp: renderGbp,
    campaigns: renderCampaigns,
    compliance: renderCompliance,
    exports: renderExports,
    help: renderHelp
  };

  function renderView() {
    const fn = viewRenderers[currentView] || renderOverview;
    main.innerHTML = fn();
    bindViewEvents();
  }

  function bindViewEvents() {
    main.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', () => setView(el.dataset.goto));
    });

    main.querySelectorAll('[data-filter]').forEach(el => {
      el.addEventListener('input', () => { filters[el.dataset.filter] = el.value; renderView(); });
      el.addEventListener('change', () => { filters[el.dataset.filter] = el.value; renderView(); });
    });

    main.querySelectorAll('[data-referral-tab]').forEach(el => {
      el.addEventListener('click', () => { referralTab = el.dataset.referralTab; renderView(); });
    });

    main.querySelectorAll('[data-select-referral]').forEach(el => {
      el.addEventListener('click', () => { selectedReferralId = el.dataset.selectReferral; renderView(); });
    });

    const contentForm = document.getElementById('content-form');
    if (contentForm) {
      contentForm.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(contentForm);
        state.content = {
          heroEyebrow: fd.get('heroEyebrow'),
          heroTitle: fd.get('heroTitle'),
          heroLead: fd.get('heroLead'),
          heroCtaPrimary: fd.get('heroCtaPrimary'),
          heroCtaPhone: fd.get('heroCtaPhone'),
          aboutBlurb: state.content.aboutBlurb
        };
        saveState();
        showToast('Hero draft saved locally.');
      });
    }

    const publishDemo = document.getElementById('publish-demo');
    if (publishDemo) {
      publishDemo.addEventListener('click', () => {
        state.approvals.unshift({ id: `A-${Date.now()}`, item: 'Homepage hero copy draft', requestedBy: 'Visual editor', status: 'Pending Dr. K review' });
        saveState();
        showToast('Queued for approval — demo only.');
      });
    }

    main.querySelectorAll('[data-advance-referral]').forEach(el => {
      el.addEventListener('click', () => {
        const r = state.referrals.find(x => x.id === el.dataset.advanceReferral);
        if (!r) return;
        const order = ['Research', 'To Contact', 'Contacted', 'Draft Email', 'Nurture', 'Active Partner'];
        const idx = order.indexOf(r.status);
        r.status = order[Math.min(idx + 1, order.length - 1)] || r.status;
        r.lastTouch = new Date().toISOString().slice(0, 10);
        saveState();
        showToast(`${r.business} → ${r.status}`);
        renderView();
      });
    });

    main.querySelectorAll('[data-draft-email]').forEach(el => {
      el.addEventListener('click', () => {
        const r = state.referrals.find(x => x.id === el.dataset.draftEmail);
        if (!r) return;
        state.mailbox.unshift({
          id: `M-${Date.now()}`,
          to: r.contactEmail || 'partners@example.com',
          subject: `Art Form partnership — ${r.group}`,
          status: 'Draft',
          sentAt: null,
          preview: `Hi ${r.contactName || 'there'} — ${r.angle}`
        });
        saveState();
        showToast('Draft added to outreach inbox.');
        setView('mailbox');
      });
    });

    document.getElementById('add-referral-demo')?.addEventListener('click', () => {
      state.referrals.unshift({
        id: `R-${Date.now()}`,
        business: 'New Tampa Bay Prospect',
        group: 'Med spas',
        city: 'Tampa Bay, FL',
        angle: 'Demo prospect added from CRM.',
        status: 'Research',
        referralsSent: 0,
        lastTouch: new Date().toISOString().slice(0, 10),
        nextStep: 'Research contact on website'
      });
      saveState();
      showToast('Demo prospect added.');
      renderView();
    });

    main.querySelectorAll('[data-find-group]').forEach(el => {
      el.addEventListener('click', () => {
        filters.referralGroup = el.dataset.findGroup;
        referralTab = 'pipeline';
        renderView();
        showToast(`Filtered to ${el.dataset.findGroup}.`);
      });
    });

    main.querySelectorAll('[data-generate-kit]').forEach(el => {
      el.addEventListener('click', () => showToast(`${el.dataset.generateKit} kit PDF generated (demo).`));
    });

    main.querySelectorAll('[data-send-mail]').forEach(el => {
      el.addEventListener('click', () => {
        const m = state.mailbox.find(x => x.id === el.dataset.sendMail);
        if (m && m.status !== 'Sent') { m.status = 'Sent'; m.sentAt = new Date().toISOString().slice(0, 10); saveState(); }
        showToast(m?.status === 'Sent' ? 'Message marked sent (demo).' : 'Opening message…');
        renderView();
      });
    });

    document.getElementById('compose-demo')?.addEventListener('click', () => showToast('Compose window would open in production CRM.'));

    main.querySelectorAll('[data-lead-action]').forEach(el => {
      el.addEventListener('click', () => {
        const l = state.leads.find(x => x.id === el.dataset.leadAction);
        if (l && l.status === 'New') { l.status = 'Contacted'; saveState(); showToast(`${l.name} marked contacted.`); renderView(); }
        else showToast(l?.notes || 'Lead notes');
      });
    });

    main.querySelectorAll('[data-seo-task]').forEach(el => {
      el.addEventListener('click', () => showToast(`Added "${el.dataset.seoTask}" to planner (demo).`));
    });

    main.querySelectorAll('[data-post-review]').forEach(el => {
      el.addEventListener('click', () => {
        const r = state.reviews.find(x => x.id === el.dataset.postReview);
        if (r) { r.status = 'Replied'; saveState(); showToast('Reply posted (demo).'); renderView(); }
      });
    });

    main.querySelectorAll('[data-review-draft]').forEach(el => {
      el.addEventListener('change', () => {
        state.reviewDrafts[el.dataset.reviewDraft] = el.value;
        saveState();
      });
    });

    main.querySelectorAll('[data-gbp-check]').forEach(el => {
      el.addEventListener('change', () => {
        const i = Number(el.dataset.gbpCheck);
        if (state.gbp.checklist[i]) { state.gbp.checklist[i].done = el.checked; saveState(); }
      });
    });

    document.getElementById('publish-gbp')?.addEventListener('click', () => showToast('GBP post scheduled for both locations (demo).'));

    document.getElementById('new-campaign')?.addEventListener('click', () => {
      state.campaigns.unshift({ id: `C-${Date.now()}`, channel: 'Instagram', title: 'New campaign draft', status: 'Draft', publishDate: '—', caption: 'Draft caption…' });
      saveState();
      showToast('Campaign draft created.');
      renderView();
    });

    main.querySelectorAll('[data-approve]').forEach(el => {
      el.addEventListener('click', () => {
        const a = state.approvals.find(x => x.id === el.dataset.approve);
        if (a) { a.status = 'Approved'; saveState(); showToast('Approved (demo).'); renderView(); }
      });
    });

    document.getElementById('download-export')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'artform-command-export.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Export downloaded.');
    });

    document.getElementById('reset-demo')?.addEventListener('click', () => {
      if (confirm('Reset all demo changes in this browser?')) {
        localStorage.removeItem(STATE_KEY);
        boot(true);
        showToast('Demo data reset.');
      }
    });

    document.getElementById('import-file')?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          state = { ...state, ...imported };
          saveState();
          renderView();
          showToast('Import merged.');
        } catch (_) {
          showToast('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    });
  }

  function unlock() {
    document.body.classList.remove('is-locked');
    app.hidden = false;
    app.setAttribute('aria-hidden', 'false');
    renderNav();
    setView('overview');
  }

  function lock() {
    document.body.classList.add('is-locked');
    app.hidden = true;
    app.setAttribute('aria-hidden', 'true');
    sessionStorage.removeItem(SESSION_KEY);
    loginInput.value = '';
    loginMessage.textContent = '';
  }

  async function boot(resetOnly) {
    try {
      const res = await fetch(DATA_URL);
      const base = res.ok ? await res.json() : {};
      if (!resetOnly) state = loadStoredState(base);
      else state = structuredClone(base);
      if (sessionStorage.getItem(SESSION_KEY) === '1') unlock();
      else main.innerHTML = '<div class="loading-panel">Loading dashboard…</div>';
    } catch (_) {
      main.innerHTML = '<div class="loading-panel">Could not load dashboard data.</div>';
    }
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginMessage.textContent = '';
    try {
      const hash = await sha256(loginInput.value);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem(SESSION_KEY, '1');
        unlock();
      } else {
        loginMessage.textContent = 'Incorrect password.';
      }
    } catch (_) {
      loginMessage.textContent = 'Could not verify password in this browser.';
    }
  });

  logoutButton.addEventListener('click', lock);
  exportButton.addEventListener('click', () => {
    setView('exports');
    setTimeout(() => document.getElementById('download-export')?.click(), 100);
  });

  nav.addEventListener('click', e => {
    const btn = e.target.closest('[data-view]');
    if (btn) setView(btn.dataset.view);
  });

  navToggle?.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  boot(false);
})();
