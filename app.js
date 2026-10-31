const $ = s => document.querySelector(s);
const T = window.TC;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = (new URLSearchParams(location.search).get('m') || '').trim();
const SHEET_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
const TEXT_CACHE = 'tc-texts';
const fmtDay = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const fmtTime = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit' });
let config = {}, guest = null, event = null, opened = false;

/* ---------- szövegek ---------- */
// Az utoljára látott szövegeket a böngésző megjegyzi, így a következő megnyitáskor nincs villanás.
let cached = null;
try { cached = JSON.parse(localStorage.getItem(TEXT_CACHE) || 'null'); } catch {}
function useTexts(texts, save) {
  T.set(texts || {});
  T.apply();
  refreshTitles();
  document.documentElement.classList.remove('t-pending');
  if (save) try { localStorage.setItem(TEXT_CACHE, JSON.stringify(texts || {})); } catch {}
}
function refreshTitles() {
  $('#hero-eyebrow').textContent = T.get(guest ? 'hero.eyebrow.invited' : 'hero.eyebrow.closed');
  document.title = guest ? T.get('page.title.guest', { 'név': guest.name }) : T.get('page.title');
}
if (cached) useTexts(cached, false);
// Ha a szerver nem válaszol, legkésőbb pár másodperc múlva az alapszövegek látszanak.
setTimeout(() => { if (document.documentElement.classList.contains('t-pending')) useTexts(cached || {}, false); }, 6000);

function door(titleKey, textKey) {
  const note = $('#door-note');
  note.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = T.get(titleKey);
  const span = document.createElement('span');
  span.innerHTML = T.rich(T.get(textKey));
  note.append(strong, span);
}

async function api(body) {
  const res = await fetch(config.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return res.json();
}

/* ---------- boríték ---------- */
function openInvite() {
  const envelope = $('#envelope'), invitation = $('#invitation');
  if (envelope.classList.contains('open')) { invitation.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' }); return; }
  opened = true;
  envelope.classList.add('open');
  envelope.setAttribute('aria-expanded', 'true');
  $('#open-label').textContent = T.get('env.opened');
  invitation.hidden = false;
  setTimeout(() => invitation.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' }), reduced ? 0 : 1100);
}
$('#envelope').addEventListener('click', openInvite);
$('#open-link').addEventListener('click', openInvite);

/* ---------- betöltés ---------- */
async function boot() {
  try {
    const r = await fetch('./event.json', { cache: 'no-store' });
    if (!r.ok) throw Error();
    config = await r.json();
  } catch { useTexts(cached, false); door('door.error.title', 'door.error.text'); return; }
  if (!SHEET_RE.test(config.sheetUrl || '')) { useTexts(cached, false); door('door.error.title', 'door.error.text'); return; }
  try {
    const data = await api(token ? { action: 'invite', token } : { action: 'texts' });
    if (data.texts) useTexts(data.texts, true); else useTexts(cached, false);
    if (!token) { door('door.none.title', 'door.none.text'); return; }
    if (!data.ok) { door(data.error === 'not_found' ? 'door.unknown.title' : 'door.error.title', data.error === 'not_found' ? 'door.unknown.text' : 'door.error.text'); return; }
    guest = data.guest; event = data.event;
  } catch { useTexts(cached, false); door('door.error.title', 'door.error.text'); return; }
  refreshTitles();
  render();
}

function render() {
  $('#door').hidden = true;
  $('#invited').hidden = false;
  $('#hero-lede').innerHTML = T.html('hero.lede', { 'név': guest.name });
  $('#letter-name').textContent = guest.name;
  $('#greeting').innerHTML = T.html('inv.greeting', { 'név': guest.name });
  renderEvent();
  renderForm();
  if (guest.response) showSuccess(false);
}

function renderEvent() {
  $('#t-guest').textContent = guest.name;
  if (guest.plusOne) {
    const s = document.createElement('small');
    s.textContent = guest.plusOneComing && guest.plusOneName ? T.get('ticket.plus.with', { partner: guest.plusOneName }) : T.get('ticket.plus.maybe');
    if (s.textContent.trim()) $('#t-guest').append(s);
  }
  const when = $('#t-when');
  when.replaceChildren();
  if (event.start) {
    const d = new Date(event.start);
    when.textContent = fmtDay.format(d);
    const s = document.createElement('small'); s.textContent = T.get('ticket.time', { 'idő': fmtTime.format(d) }); when.append(s);
  } else {
    const a = document.createElement('span'); a.className = 'tbd'; a.textContent = T.get('ticket.tbd');
    const b = document.createElement('small'); b.textContent = T.get('ticket.tbd.note');
    when.append(a); if (b.textContent.trim()) when.append(b);
  }
  const where = $('#t-where');
  where.replaceChildren();
  if (event.venue || event.city) {
    where.textContent = event.venue || event.city;
    if (event.venue && event.city) { const s = document.createElement('small'); s.textContent = event.city; where.append(s); }
    const q = [event.city, event.venue].filter(Boolean).join(', ');
    $('#map-link').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
    $('#map-link').hidden = !T.get('ticket.map').trim();
  } else { const a = document.createElement('span'); a.className = 'tbd'; a.textContent = T.get('ticket.tbd'); where.append(a); }
  $('#t-note').textContent = event.note || '';
}

/* ---------- visszajelzés ---------- */
const form = $('#rsvp-form'), fields = $('#form-fields');
function syncForm() {
  const yes = form.elements.attending.value === 'yes';
  $('#plus-row').hidden = !(guest && guest.plusOne && yes);
  $('#plus-name-row').hidden = $('#plus-row').hidden || form.elements.plusOne.value !== 'yes';
}
form.addEventListener('change', syncForm);

function renderForm() {
  if (guest.response) form.elements.attending.value = guest.response;
  form.elements.plusOne.value = guest.plusOneComing ? 'yes' : 'no';
  $('#rsvp-plus-name').value = guest.plusOneName || '';
  $('#rsvp-notes').value = guest.notes || '';
  $('#rsvp-consent').checked = !!guest.response;
  syncForm();
  fields.disabled = !event.registrationOpen;
  $('#config-notice').textContent = event.registrationOpen ? '' : T.get('msg.closed.form');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (form.elements._honey.value) return;
  const status = $('#form-status');
  const attending = form.elements.attending.value;
  const plusOneComing = guest.plusOne && attending === 'yes' && form.elements.plusOne.value === 'yes';
  const plusOneName = $('#rsvp-plus-name').value.trim();
  if (plusOneComing && plusOneName.length < 2) { status.textContent = T.get('msg.partner'); $('#rsvp-plus-name').focus(); return; }
  if (!$('#rsvp-consent').checked) { status.textContent = T.get('msg.consent'); $('#rsvp-consent').focus(); return; }
  const notes = $('#rsvp-notes').value.trim();
  fields.disabled = true;
  status.textContent = T.get('msg.sending');
  try {
    const data = await api({ action: 'rsvp', token, attending, plusOneComing, plusOneName, notes });
    if (!data.ok) throw Error(T.get(data.error === 'closed' ? 'msg.closed' : data.error === 'busy' ? 'msg.busy' : 'msg.error'));
    guest = data.guest; event = data.event;
    notifyByEmail();
    status.textContent = '';
    renderEvent();
    showSuccess(true);
  } catch (err) {
    status.textContent = err.name === 'TimeoutError' || err instanceof TypeError ? T.get('msg.network') : err.message;
  } finally { fields.disabled = !event.registrationOpen; }
});

// E-mail értesítés a szervezőnek (FormSubmit). Nem kritikus: a válasz már a táblázatban van.
function notifyByEmail() {
  if (!/^[a-zA-Z0-9-]+$/.test(config.formId || '')) return;
  const payload = {
    name: guest.name,
    'Részvétel': guest.response === 'yes' ? 'Jön' : 'Nem jön',
    'Partner': guest.plusOneComing ? (guest.plusOneName || 'Igen') : '—',
    'Megjegyzés': guest.notes || '—',
    'Esemény': T.get('cal.title'),
    _subject: `${T.get('cal.title')} · ${guest.name}: ${guest.response === 'yes' ? 'jön' : 'nem jön'}`,
    _template: 'table', _honey: ''
  };
  fetch('https://formsubmit.co/ajax/' + encodeURIComponent(config.formId), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
}

function showSuccess(focus) {
  const yes = guest.response === 'yes';
  const key = yes ? (guest.plusOneComing ? 'tg.yes.pair' : 'tg.yes.solo') : 'tg.no';
  $('#tg-text').innerHTML = T.html(key, { 'név': guest.name, partner: guest.plusOneName || '' }, 'em');
  const showCal = yes && !!event.start;
  $('#calendar-actions').hidden = !showCal;
  if (showCal) {
    const p = new URLSearchParams({ action: 'TEMPLATE', text: T.get('cal.title'), dates: `${calDate(event.start)}/${calDate(event.start)}`, location: location_(), details: calDetails(), ctz: 'Europe/Budapest' });
    $('#google-calendar').href = `https://calendar.google.com/calendar/render?${p}`;
  }
  $('#edit-rsvp').hidden = !event.registrationOpen;
  $('#edit-note').hidden = !event.registrationOpen;
  form.hidden = true;
  $('#success').hidden = false;
  if (focus) $('#success').focus();
}

$('#edit-rsvp').addEventListener('click', () => {
  $('#success').hidden = true;
  form.hidden = false;
  form.querySelector('input[name=attending]:checked').focus();
});

/* ---------- naptár ---------- */
const calDate = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const location_ = () => [event.venue, event.city].filter(Boolean).join(', ');
const calDetails = () => [T.get('cal.details'), event.note || '', location.href].filter(Boolean).join('\n');
function escapeICS(v) { return v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
// UTF-8 bájtok szerint tördelünk (RFC 5545, Apple Naptár).
function fold(line) { let out = '', n = 0; for (const ch of line) { const len = new TextEncoder().encode(ch).length; if (n + len > 75) { out += '\r\n '; n = 1; } out += ch; n += len; } return out; }
$('#apple-calendar').addEventListener('click', () => {
  if (!event?.start) return;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//30th in the 30s//Invitation//HU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:thirty-club-${calDate(event.start)}@invitation.local`, `DTSTAMP:${calDate(new Date())}`, `DTSTART:${calDate(event.start)}`, `SUMMARY:${escapeICS(T.get('cal.title'))}`, `LOCATION:${escapeICS(location_())}`, `DESCRIPTION:${escapeICS(calDetails())}`, 'END:VEVENT', 'END:VCALENDAR'];
  const url = URL.createObjectURL(new Blob([lines.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = '30th-in-the-30s.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});

boot();
