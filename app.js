
const API = 'https://api.github.com';

const cache = new Map();

const LANGUAGE_COLORS = {
  JavaScript:'#f1e05a', TypeScript:'#3178c6', Python:'#3572A5', Java:'#b07219',
  'C++':'#f34b7d', C:'#555555', 'C#':'#178600', Go:'#00ADD8', Rust:'#dea584',
  Ruby:'#701516', PHP:'#4F5D95', HTML:'#e34c26', CSS:'#563d7c', Shell:'#89e051',
  Swift:'#F05138', Kotlin:'#A97BFF', Dart:'#00B4AB', Vue:'#41b883', Jupyter:'#DA5B0B',
  'Objective-C':'#438eff', Scala:'#c22d40', Elixir:'#6e4a7e', Haskell:'#5e5086',
  Lua:'#000080', Perl:'#0298c3', R:'#198CE7', MATLAB:'#e16737', Zig:'#ec915c',
  Nix:'#7e7eff', Solidity:'#AA6746', Dockerfile:'#384d54', Makefile:'#427819'
};
const FALLBACK_PALETTE = ['#3ecf8e','#644fc1','#e2005a','#054cff','#ffdb13','#ff2201','#c7007e','#24b47e'];

function colorForLanguage(name, indexFallback){
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
  return FALLBACK_PALETTE[indexFallback % FALLBACK_PALETTE.length];
}

async function ghFetch(url){
  if (cache.has(url)) return cache.get(url);

  let res;
  try{
    res = await fetch(url, { headers:{ 'Accept':'application/vnd.github+json' } });
  }catch(networkErr){
    const result = { ok:false, kind:'network', status:0 };
    return result; 
  }

  const remaining = res.headers.get('x-ratelimit-remaining');
  const resetHeader = res.headers.get('x-ratelimit-reset');

  if (res.status === 403 && remaining === '0'){
    const resetTime = resetHeader ? new Date(parseInt(resetHeader,10) * 1000) : null;
    const result = { ok:false, kind:'rate-limit', status:403, resetTime };
    return result; 
  }
  if (res.status === 404){
    const result = { ok:false, kind:'not-found', status:404 };
    cache.set(url, result);
    return result;
  }
  if (!res.ok){
    const result = { ok:false, kind:'error', status:res.status };
    return result;
  }

  const data = await res.json();
  const result = { ok:true, data };
  cache.set(url, result);
  return result;
}

async function getUser(username){
  return ghFetch(`${API}/users/${encodeURIComponent(username)}`);
}
async function getRepos(username){
  return ghFetch(`${API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
}
async function getLanguages(owner, repoName){
  return ghFetch(`${API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/languages`);
}

async function computeLanguageBreakdown(owner, repos){
  const totals = {};
  const reposWithLanguage = repos.filter(r => r.language);

  const bump = (lang, amount) => { totals[lang] = (totals[lang]||0) + amount; };

  reposWithLanguage.forEach(r => bump(r.language, 1)); 

  const topForDetail = [...repos]
    .filter(r => !r.fork)
    .sort((a,b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 8);

  const detailResults = await Promise.all(
    topForDetail.map(r => getLanguages(owner, r.name))
  );

  detailResults.forEach(result => {
    if (result.ok){
      Object.entries(result.data).forEach(([lang, bytes]) => bump(lang, bytes));
    }
    
  });

  const entries = Object.entries(totals).sort((a,b) => b[1]-a[1]);
  const total = entries.reduce((s,[,v]) => s+v, 0) || 1;
  return entries.map(([name, value], i) => ({
    name, value, pct: value/total, color: colorForLanguage(name, i)
  }));
}

function renderDonutChart(container, langData){
  container.innerHTML = '';
  if (!langData.length){
    container.innerHTML = '<p class="empty-panel">No language data available for this account yet.</p>';
    return;
  }

  const size = 200, stroke = 26, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const cx = size/2, cy = size/2;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);

  const bg = document.createElementNS(svgNS, 'circle');
  bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
  bg.setAttribute('fill', 'none');
  bg.setAttribute('stroke', 'var(--hairline)');
  bg.setAttribute('stroke-width', stroke);
  svg.appendChild(bg);

  let offset = 0;
  const top = langData.slice(0, 7);
  const others = langData.slice(7);
  const othersValue = others.reduce((s,l)=>s+l.value,0);
  const totalValue = top.reduce((s,l)=>s+l.value,0) + othersValue;
  const slices = othersValue > 0
    ? [...top, { name:'Other', value:othersValue, pct: othersValue/totalValue, color:'#9a9a9a' }]
    : top;

  slices.forEach((lang, i) => {
    const seg = document.createElementNS(svgNS, 'circle');
    const len = lang.pct * c;
    seg.setAttribute('cx', cx); seg.setAttribute('cy', cy); seg.setAttribute('r', r);
    seg.setAttribute('fill', 'none');
    seg.setAttribute('stroke', lang.color);
    seg.setAttribute('stroke-width', stroke);
    seg.setAttribute('stroke-dasharray', `${len} ${c-len}`);
    seg.setAttribute('stroke-dashoffset', -offset);
    seg.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    seg.setAttribute('stroke-linecap', slices.length===1 ? 'butt' : 'butt');
    seg.style.transition = 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease';
    seg.style.animation = `growSlice 0.8s ease ${i*0.06}s both`;
    offset += len;
    svg.appendChild(seg);
  });

  const centerText = document.createElementNS(svgNS,'text');
  centerText.setAttribute('x', cx); centerText.setAttribute('y', cy-4);
  centerText.setAttribute('text-anchor','middle');
  centerText.setAttribute('font-size','13');
  centerText.setAttribute('fill','var(--text-mute)');
  centerText.textContent = `${langData.length} langs`;
  svg.appendChild(centerText);

  const centerSub = document.createElementNS(svgNS,'text');
  centerSub.setAttribute('x', cx); centerSub.setAttribute('y', cy+16);
  centerSub.setAttribute('text-anchor','middle');
  centerSub.setAttribute('font-size','11');
  centerSub.setAttribute('fill','var(--ink-faint)');
  centerSub.textContent = 'detected';
  svg.appendChild(centerSub);

  container.appendChild(svg);

  const legend = document.createElement('div');
  legend.className = 'lang-legend';
  slices.forEach(lang => {
    const row = document.createElement('div');
    row.className = 'lang-legend__row';
    row.innerHTML = `
      <span class="lang-legend__swatch" style="background:${lang.color}"></span>
      <span class="lang-legend__name">${escapeHtml(lang.name)}</span>
      <span class="lang-legend__pct">${(lang.pct*100).toFixed(1)}%</span>
    `;
    legend.appendChild(row);
  });
  container.appendChild(legend);
}

(function injectSliceAnim(){
  const style = document.createElement('style');
  style.textContent = `@keyframes growSlice{ from{ opacity:0; } to{ opacity:1; } }`;
  document.head.appendChild(style);
})();

function renderRepoCards(container, repos){
  container.innerHTML = '';
  if (!repos.length){
    container.innerHTML = '<p class="empty-panel">This account has no public repositories yet.</p>';
    return;
  }
  const top = [...repos]
    .sort((a,b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)))
    .slice(0, 6);

  top.forEach((repo, i) => {
    const card = document.createElement('a');
    card.className = 'repo-card';
    card.href = repo.html_url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.style.animation = `fadeIn .4s ease ${i*0.05}s both`;
    const langColor = repo.language ? colorForLanguage(repo.language, i) : 'var(--ink-faint)';
    card.innerHTML = `
      <span class="repo-card__name">${escapeHtml(repo.name)}</span>
      <span class="repo-card__desc">${escapeHtml(repo.description || 'No description provided.')}</span>
      <span class="repo-card__footer">
        <span>★ ${formatCount(repo.stargazers_count)}</span>
        <span>⑂ ${formatCount(repo.forks_count)}</span>
        ${repo.language ? `<span class="repo-card__lang"><span class="repo-card__lang-dot" style="background:${langColor}"></span>${escapeHtml(repo.language)}</span>` : ''}
      </span>
    `;
    container.appendChild(card);
  });
}

function renderIdentity(card, user){
  card.querySelector('.profile-card__avatar').src = user.avatar_url;
  card.querySelector('.profile-card__avatar').alt = `${user.login} avatar`;
  card.querySelector('.profile-card__name').textContent = user.name || user.login;
  card.querySelector('.profile-card__login').textContent = `@${user.login}`;

  const meta = card.querySelector('.profile-card__meta');
  meta.innerHTML = '';
  const metaItems = [
    user.company && `🏢 ${user.company}`,
    user.location && `📍 ${user.location}`,
    user.blog && `🔗 ${user.blog}`,
    `📅 joined ${new Date(user.created_at).toLocaleDateString(undefined,{year:'numeric', month:'short'})}`
  ].filter(Boolean);
  metaItems.forEach(text => {
    const span = document.createElement('span');
    span.textContent = text;
    meta.appendChild(span);
  });

  const stats = card.querySelector('.profile-card__stats');
  stats.innerHTML = '';
  const statList = [
    ['Repositories', user.public_repos],
    ['Followers', user.followers],
    ['Following', user.following],
    ['Gists', user.public_gists]
  ];
  statList.forEach(([label, value]) => {
    const el = document.createElement('div');
    el.className = 'stat';
    el.innerHTML = `<span class="stat__value">${formatCount(value)}</span><span class="stat__label">${label}</span>`;
    stats.appendChild(el);
  });

  typeBio(card.querySelector('.profile-card__bio'), user.bio || 'This developer hasn\u2019t written a bio yet.');
}

function typeBio(el, text){
  el.textContent = '';
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.textContent = '|';
  el.appendChild(document.createTextNode(''));
  let i = 0;
  const speed = Math.max(8, Math.min(28, 900 / text.length));
  el.textContent = '';
  function step(){
    el.textContent = text.slice(0, i);
    el.appendChild(caret);
    i++;
    if (i <= text.length){
      setTimeout(step, speed);
    } else {
      caret.remove();
    }
  }
  step();
}

function formatCount(n){
  if (n === undefined || n === null) return '0';
  if (n >= 1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,'') + 'k';
  return String(n);
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function minutesUntil(date){
  return Math.max(1, Math.round((date.getTime() - Date.now()) / 60000));
}

async function buildProfileInto(container, username, onStatus){
  const template = document.getElementById('profileTemplate');
  const node = template.content.firstElementChild.cloneNode(true);
  container.innerHTML = '';
  container.appendChild(node);

  const userResult = await getUser(username);
  if (!userResult.ok){
    return { error: userResult };
  }
  const user = userResult.data;
  renderIdentity(node, user);

  const reposResult = await getRepos(username);
  if (!reposResult.ok){
    node.querySelector('.chart-wrap').innerHTML = '<p class="empty-panel">Repository data unavailable right now (GitHub API limit or network issue). Profile info above is still live.</p>';
    node.querySelector('.repo-grid').innerHTML = '';
    node.querySelector('.panel--repos .panel__tag').textContent = '';
    if (onStatus) onStatus(reposResult);
    return { user, repos: [], node };
  }

  const repos = reposResult.data;
  node.querySelector('.panel--repos .panel__tag').textContent = `${repos.length} public repo${repos.length===1?'':'s'}`;

  renderRepoCards(node.querySelector('.repo-grid'), repos);

  const langData = await computeLanguageBreakdown(user.login, repos);
  renderDonutChart(node.querySelector('.chart-wrap'), langData);

  return { user, repos, node };
}

const els = {
  form: document.getElementById('searchForm'),
  input: document.getElementById('usernameInput'),
  input2: document.getElementById('usernameInput2'),
  compareRow: document.getElementById('compareRow'),
  compareToggle: document.getElementById('compareToggle'),
  loading: document.getElementById('loadingState'),
  empty: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyMessage: document.getElementById('emptyMessage'),
  results: document.getElementById('results'),
  profileGrid: document.getElementById('profileGrid'),
  compareResults: document.getElementById('compareResults'),
  compareCol1: document.getElementById('compareCol1'),
  compareCol2: document.getElementById('compareCol2'),
  statusBanner: document.getElementById('statusBanner'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
};

let compareMode = false;

function setStatus(message, kind){
  if (!message){
    els.statusBanner.className = 'status-banner hidden';
    els.statusBanner.textContent = '';
    return;
  }
  els.statusBanner.className = `status-banner ${kind}`;
  els.statusBanner.textContent = message;
}

function showLoading(){
  setStatus(null);
  els.empty.classList.add('hidden');
  els.results.classList.add('hidden');
  els.compareResults.classList.add('hidden');
  els.loading.classList.remove('hidden');
}
function showEmpty(title, message){
  els.loading.classList.add('hidden');
  els.results.classList.add('hidden');
  els.compareResults.classList.add('hidden');
  els.emptyTitle.textContent = title;
  els.emptyMessage.textContent = message;
  els.empty.classList.remove('hidden');
}
function showResults(){
  els.loading.classList.add('hidden');
  els.empty.classList.add('hidden');
}

function messageForFailure(result, username){
  if (result.kind === 'not-found'){
    return {
      title: 'User not found',
      message: `We couldn't find a GitHub account named "${username}". Check the spelling — usernames are case-insensitive but must match exactly otherwise.`
    };
  }
  if (result.kind === 'rate-limit'){
    const mins = result.resetTime ? minutesUntil(result.resetTime) : null;
    return {
      title: 'GitHub rate limit reached',
      message: mins
        ? `The unauthenticated GitHub API allows 60 requests/hour, and that limit has been hit. It resets in about ${mins} minute${mins===1?'':'s'}. Try again shortly.`
        : `The unauthenticated GitHub API allows 60 requests/hour, and that limit has been hit. Please try again in a few minutes.`
    };
  }
  if (result.kind === 'network'){
    return {
      title: 'Network error',
      message: 'Could not reach the GitHub API. Check your connection and try again.'
    };
  }
  return {
    title: 'Something went wrong',
    message: `GitHub responded with an unexpected error (status ${result.status || 'unknown'}). Please try again.`
  };
}

async function runSingleSearch(username){
  showLoading();
  const result = await buildProfileInto(els.profileGrid, username, (statusResult) => {
    const {title, message} = messageForFailure(statusResult, username);
    setStatus(`${title}: ${message}`, statusResult.kind === 'rate-limit' ? 'warn' : 'error');
  });

  if (result.error){
    const {title, message} = messageForFailure(result.error, username);
    showEmpty(title, message);
    return;
  }

  showResults();
  els.results.classList.remove('hidden');
}

async function runCompareSearch(u1, u2){
  showLoading();
  els.compareCol1.innerHTML = '';
  els.compareCol2.innerHTML = '';

  const [r1, r2] = await Promise.all([
    buildProfileInto(els.compareCol1, u1),
    buildProfileInto(els.compareCol2, u2)
  ]);

  if (r1.error && r2.error){
    const {title, message} = messageForFailure(r1.error, u1);
    showEmpty(title, message);
    return;
  }
  if (r1.error){
    const {title, message} = messageForFailure(r1.error, u1);
    els.compareCol1.innerHTML = `<div class="empty-panel"><strong>${escapeHtml(title)}</strong><br>${escapeHtml(message)}</div>`;
  }
  if (r2.error){
    const {title, message} = messageForFailure(r2.error, u2);
    els.compareCol2.innerHTML = `<div class="empty-panel"><strong>${escapeHtml(title)}</strong><br>${escapeHtml(message)}</div>`;
  }

  showResults();
  els.compareResults.classList.remove('hidden');
}

els.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const u1 = els.input.value.trim();
  if (!u1) return;

  if (compareMode){
    const u2 = els.input2.value.trim();
    if (!u2) return;
    runCompareSearch(u1, u2);
  } else {
    runSingleSearch(u1);
  }
});

els.compareToggle.addEventListener('click', () => {
  compareMode = !compareMode;
  els.compareRow.classList.toggle('hidden', !compareMode);
  els.compareToggle.textContent = compareMode ? 'Single mode' : 'Compare mode';
  els.compareToggle.classList.toggle('btn--outline', true);
});

function applyTheme(theme){
  document.body.setAttribute('data-theme', theme);
  els.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}
let currentTheme = 'light';
els.themeToggle.addEventListener('click', () => {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(currentTheme);
});

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches){
  currentTheme = 'dark';
  applyTheme(currentTheme);
}
