const $ = s => document.querySelector(s);
const KEY_NAME = 'tc-admin-key';
const store = {
  get() { try { return sessionStorage.getItem(KEY_NAME) || localStorage.getItem(KEY_NAME) || ''; } catch { return ''; } },
  set(k, remember) { try { sessionStorage.setItem(KEY_NAME, k); if (remember) localStorage.setItem(KEY_NAME, k); } catch {} },
  clear() { try { sessionStorage.removeItem(KEY_NAME); localStorage.removeItem(KEY_NAME); } catch {} }
};
let sheetUrl = '', key = '', guests = [], event = {}, editing = '';
const status = t => { $('#status').textContent = t; };
const configReady = fetch('./event.json', { cache: 'no-store' }).then(r => r.json()).then(d => { sheetUrl = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(d.sheetUrl || '') ? d.sheetUrl : ''; }).catch(() => {});

let toastTimer;
function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600); }

async function api(body) {
  await configReady;
  if (!sheetUrl) throw Error('A Google Táblázat még nincs bekötve (event.json → sheetUrl).');
  let data;
  try {
    const res = await fetch(sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, key }), signal: AbortSignal.timeout(30000) });
    data = await res.json();
  } catch { throw Error('Hálózati hiba. Próbáld újra.'); }
  if (!data.ok) {
    if (data.error === 'unauthorized') { logout('Hibás admin kulcs.'); throw Error('Hibás admin kulcs.'); }
    throw Error({ busy: 'A táblázat épp foglalt. Próbáld újra pár másodperc múlva.', not_found: 'Ez a vendég már nincs a listán. Frissítsd az oldalt.', bad_request: 'Hiányzó vagy hibás adat.' }[data.error] || 'A művelet nem sikerült.');
  }
  return data;
}

async function load() {
  status('Betöltés…');
  try {
    const data = await api({ action: 'list' });
    guests = data.guests.map(g => ({ ...g, createdT: Date.parse(g.created) || 0 })).sort((a, b) => a.createdT - b.createdT);
    event = data.event;
    if (data.sheetUrl) { $('#sheet-link').href = data.sheetUrl; $('#sheet-link').hidden = false; }
    $('#login').hidden = true; $('#app').hidden = false;
    status('');
    fillEvent();
    render();
    return true;
  } catch (err) { status(err.message); return false; }
}

/* ---------- linkek és másolás ---------- */
const inviteUrl = g => new URL('./?m=' + encodeURIComponent(g.token), location.href).href;
const inviteMessage = g => `Szia ${g.name}! Harminc leszek, és ezt a harmincas évek stílusában ünnepeljük: The Thirty Club, 30th in the 30s. Itt a személyes meghívód, kérlek, jelezz vissza rajta: ${inviteUrl(g)}`;
async function copy(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    toast(ok ? done : 'Nem sikerült másolni. Nyisd meg a linket, és másold ki a címsorból.');
  }
}

/* ---------- lista ---------- */
const fmt = iso => iso ? new Date(iso).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const heads = g => g.response === 'yes' ? 1 + (g.plusOneComing ? 1 : 0) : 0;

function render() {
  $('#s-invited').textContent = guests.length;
  $('#s-opened').textContent = guests.filter(g => g.opens > 0).length;
  $('#s-heads').textContent = guests.reduce((n, g) => n + heads(g), 0);
  $('#s-no').textContent = guests.filter(g => g.response === 'no').length;
  $('#s-pending').textContent = guests.filter(g => !g.response).length;

  const q = $('#search').value.trim().toLowerCase(), f = $('#filter').value;
  const shown = guests.filter(g =>
    (f === 'all' || (f === 'yes' && g.response === 'yes') || (f === 'no' && g.response === 'no') || (f === 'pending' && !g.response) || (f === 'unopened' && !g.opens) || (f === 'notes' && g.notes.trim()))
    && (!q || [g.name, g.plusOneName, g.notes].some(v => (v || '').toLowerCase().includes(q))));

  const rows = $('#rows'); rows.replaceChildren();
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const btn = (text, fn, cls = '') => { const b = el('button', 'btn ghost small ' + cls, text); b.type = 'button'; b.addEventListener('click', fn); return b; };

  for (const g of shown) {
    const tr = document.createElement('tr');
    const cell = (label, cls) => { const td = el('td', cls); td.dataset.label = label; tr.append(td); return td; };

    const c1 = cell('Vendég'); c1.append(el('span', 'name', g.name)); if (g.plusOne) c1.append(el('span', 'tag plus', '+1'));
    const c2 = cell('Állapot');
    if (g.response === 'yes') c2.append(el('span', 'tag yes', 'Jön'));
    else if (g.response === 'no') c2.append(el('span', 'tag no', 'Nem jön'));
    else if (g.opens) c2.append(el('span', 'tag opened', 'Megnyitotta'));
    else c2.append(el('span', 'tag', 'Nem nyitotta meg'));
    if (g.respondedAt) c2.append(el('span', 'sub', fmt(g.respondedAt)));
    const c3 = cell('Partner'); c3.textContent = g.plusOneComing ? (g.plusOneName || 'Igen') : (g.plusOne ? (g.response ? 'Egyedül' : 'Hozhat') : '—');
    cell('Megjegyzés', 'notes').textContent = g.notes || '—';
    const c5 = cell('Megnyitva', 'muted'); c5.textContent = g.opens ? `${g.opens}× · ${fmt(g.lastOpen)}` : '—';
    const c6 = cell('Meghívó');
    const acts = el('div', 'row-actions');
    acts.append(
      btn('Link', () => copy(inviteUrl(g), `${g.name} linkje a vágólapon.`)),
      btn('Üzenet', () => copy(inviteMessage(g), `${g.name} meghívó üzenete a vágólapon.`)),
      btn('Szerkeszt', () => { editing = editing === g.token ? '' : g.token; render(); })
    );
    c6.append(acts);
    rows.append(tr);

    if (editing === g.token) rows.append(editRow(g, el, btn));
  }
  $('#count').textContent = guests.length ? `${shown.length} vendég látható a ${guests.length}-ből. A Link gomb a személyes meghívót másolja, az Üzenet egy kész szöveget linkkel együtt.` : 'Még nincs meghívott vendég. Add hozzá az első neveket fent.';
}

function editRow(g, el, btn) {
  const tr = el('tr', 'edit-row'); const td = el('td'); td.colSpan = 6; tr.append(td);
  const grid = el('div', 'edit-grid');
  const nameWrap = el('div'); const lbl = el('label', 'lbl', 'Név a meghívón'); lbl.htmlFor = 'edit-name'; const input = el('input'); input.id = 'edit-name'; input.type = 'text'; input.maxLength = 100; input.value = g.name; nameWrap.append(lbl, input);
  const plusLbl = el('label', 'check'); plusLbl.htmlFor = 'edit-plus'; const plus = el('input'); plus.type = 'checkbox'; plus.id = 'edit-plus'; plus.checked = g.plusOne; plusLbl.append(plus, el('span', null, 'Partnert is hozhat (+1)'));
  let armed = false;
  const del = btn('Törlés', async () => {
    if (!armed) { armed = true; del.textContent = 'Biztosan törlöd?'; setTimeout(() => { armed = false; del.textContent = 'Törlés'; }, 4000); return; }
    try { await api({ action: 'deleteGuest', token: g.token }); editing = ''; toast(`${g.name} törölve. A linkje már nem működik.`); await load(); } catch (err) { toast(err.message); }
  }, 'danger');
  const save = el('button', 'btn small', 'Mentés'); save.type = 'button';
  save.addEventListener('click', async () => {
    const name = input.value.trim(); if (!name) { input.focus(); return; }
    save.disabled = true;
    try { await api({ action: 'updateGuest', token: g.token, name, plusOne: plus.checked }); editing = ''; toast('Mentve.'); await load(); } catch (err) { toast(err.message); save.disabled = false; }
  });
  const actions = el('div', 'row-actions'); actions.append(save, btn('Mégse', () => { editing = ''; render(); }), del);
  grid.append(nameWrap, plusLbl, actions);
  td.append(grid);
  setTimeout(() => input.focus(), 0);
  return tr;
}

/* ---------- vendégek hozzáadása ---------- */
$('#add-form').addEventListener('submit', async e => {
  e.preventDefault();
  const names = [...new Set($('#add-names').value.split('\n').map(s => s.trim()).filter(Boolean))];
  if (!names.length) { toast('Írj be legalább egy nevet.'); $('#add-names').focus(); return; }
  const b = e.target.querySelector('button'); b.disabled = true;
  try {
    const res = await api({ action: 'addGuests', names, plusOne: $('#add-plus').checked });
    $('#add-names').value = '';
    toast(`${res.tokens.length} meghívó elkészült. A linkeket a listában másolhatod.`);
    await load();
  } catch (err) { toast(err.message); }
  b.disabled = false;
});

/* ---------- esemény adatai ---------- */
const partsIn = (d, opts) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Budapest', hourCycle: 'h23', ...opts }).formatToParts(d).map(p => [p.type, p.value]));
function budapestISO(date, time) {
  const guess = new Date(`${date}T${time}:00Z`);
  const p = partsIn(guess, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const offsetMin = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - guess.getTime()) / 60000);
  const sign = offsetMin >= 0 ? '+' : '-', abs = Math.abs(offsetMin);
  return `${date}T${time}:00${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}
function fillEvent() {
  if (event.start) {
    const p = partsIn(new Date(event.start), { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    $('#ev-date').value = `${p.year}-${p.month}-${p.day}`; $('#ev-time').value = `${p.hour}:${p.minute}`;
  } else { $('#ev-date').value = ''; $('#ev-time').value = ''; }
  $('#ev-venue').value = event.venue || ''; $('#ev-city').value = event.city || ''; $('#ev-note').value = event.note || '';
  $('#ev-open').checked = !!event.registrationOpen;
}
$('#event-form').addEventListener('submit', async e => {
  e.preventDefault();
  const date = $('#ev-date').value, time = $('#ev-time').value || '19:00';
  const b = e.target.querySelector('button'); b.disabled = true;
  try {
    const res = await api({ action: 'saveEvent', start: date ? budapestISO(date, time) : '', venue: $('#ev-venue').value, city: $('#ev-city').value, note: $('#ev-note').value, registrationOpen: $('#ev-open').checked });
    event = res.event; fillEvent(); toast('Az est adatai elmentve.');
  } catch (err) { toast(err.message); }
  b.disabled = false;
});

/* ---------- belépés, eszköztár ---------- */
function logout(msg) { store.clear(); key = ''; guests = []; $('#rows').replaceChildren(); $('#app').hidden = true; $('#login').hidden = false; status(msg); }
$('#login').addEventListener('submit', async e => {
  e.preventDefault();
  key = $('#login-key').value.trim();
  if (await load()) { store.set(key, $('#login-remember').checked); e.target.reset(); }
});
for (const id of ['#search', '#filter']) $(id).addEventListener('input', render);
$('#refresh').addEventListener('click', load);
$('#logout').addEventListener('click', () => logout('Kiléptél.'));
$('#export').addEventListener('click', () => {
  const cell = v => { let t = String(v ?? ''); if (/^\s*[=+\-@]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  const rows = [['Név', 'Válasz', 'Fő', 'Partner', 'Megjegyzés', 'Válasz ideje', 'Megnyitások', 'Utolsó megnyitás', 'Meghívó link'],
    ...guests.map(g => [g.name, g.response === 'yes' ? 'Jön' : g.response === 'no' ? 'Nem jön' : 'Nincs válasz', heads(g), g.plusOneComing ? g.plusOneName : '', g.notes, fmt(g.respondedAt), g.opens, fmt(g.lastOpen), inviteUrl(g)])];
  const url = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'thirty-club-vendeglista.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});

key = store.get();
if (key) load();
