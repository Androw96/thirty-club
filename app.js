const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = (new URLSearchParams(location.search).get('m') || '').trim();
const SHEET_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
const fmtDay = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const fmtTime = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit' });
let config = {}, guest = null, event = null;

function door(title, text) {
  const note = $('#door-note');
  note.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = title;
  note.append(strong, text);
}

async function api(body) {
  const res = await fetch(config.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return res.json();
}

/* ---------- boríték ---------- */
function openInvite() {
  const envelope = $('#envelope'), invitation = $('#invitation');
  if (envelope.classList.contains('open')) { invitation.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' }); return; }
  envelope.classList.add('open');
  envelope.setAttribute('aria-expanded', 'true');
  $('#open-link').innerHTML = 'A meghívód <span>↓</span>';
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
  } catch { door('Hiba', 'Az oldal beállításait nem sikerült betölteni. Frissítsd az oldalt.'); return; }
  if (!SHEET_RE.test(config.sheetUrl || '')) { door('Hamarosan', 'A meghívók kiküldése hamarosan indul.'); return; }
  if (!token) { door('Csak meghívóval', 'Ez egy zártkörű est. Az ajtó a személyes meghívó linkjével nyílik, amit a házigazdától kaptál.'); return; }
  try {
    const data = await api({ action: 'invite', token });
    if (!data.ok) {
      if (data.error === 'not_found') door('Ismeretlen meghívó', 'Ezt a meghívót nem találjuk. Ellenőrizd, hogy a teljes linket nyitottad-e meg, vagy kérj újat a házigazdától.');
      else door('Hiba', 'A meghívót most nem sikerült betölteni. Próbáld újra pár perc múlva.');
      return;
    }
    guest = data.guest; event = data.event;
  } catch { door('Hálózati hiba', 'A meghívót most nem sikerült betölteni. Ellenőrizd a kapcsolatot, és frissítsd az oldalt.'); return; }
  render();
}

function render() {
  $('#door').hidden = true;
  $('#invited').hidden = false;
  $('#hero-eyebrow').textContent = 'Személyes meghívó · Est. 1996';
  $('#hero-lede').textContent = `Kedves ${guest.name}, a klub ajtaja nyitva áll előtted.`;
  $('#letter-name').textContent = guest.name;
  $('#greeting').textContent = `Kedves ${guest.name}!`;
  document.title = `${guest.name} · The Thirty Club`;
  renderEvent();
  renderForm();
  if (guest.response) showSuccess(false);
}

function renderEvent() {
  $('#t-guest').textContent = guest.name;
  if (guest.plusOne) { const s = document.createElement('small'); s.textContent = guest.plusOneComing && guest.plusOneName ? `és ${guest.plusOneName}` : 'partnerrel együtt is jöhetsz'; $('#t-guest').append(s); }
  const when = $('#t-when');
  if (event.start) {
    const d = new Date(event.start);
    when.textContent = fmtDay.format(d);
    const s = document.createElement('small'); s.textContent = `${fmtTime.format(d)}-tól`; when.append(s);
  } else when.innerHTML = '<span class="tbd">Hamarosan</span><small>A pontos időpontot itt fogod látni.</small>';
  const where = $('#t-where');
  if (event.venue || event.city) {
    where.textContent = event.venue || event.city;
    if (event.venue && event.city) { const s = document.createElement('small'); s.textContent = event.city; where.append(s); }
    const q = [event.city, event.venue].filter(Boolean).join(', ');
    $('#map-link').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
    $('#map-link').hidden = false;
  } else where.innerHTML = '<span class="tbd">Hamarosan</span>';
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
  $('#config-notice').textContent = event.registrationOpen ? '' : 'A visszajelzés most szünetel. Hamarosan újra megnyílik.';
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (form.elements._honey.value) return;
  const status = $('#form-status');
  const attending = form.elements.attending.value;
  const plusOneComing = guest.plusOne && attending === 'yes' && form.elements.plusOne.value === 'yes';
  const plusOneName = $('#rsvp-plus-name').value.trim();
  if (plusOneComing && plusOneName.length < 2) { status.textContent = 'Írd be a partnered nevét, hogy a jegyére is ráírhassuk.'; $('#rsvp-plus-name').focus(); return; }
  if (!$('#rsvp-consent').checked) { status.textContent = 'A küldéshez pipáld be a hozzájárulást.'; $('#rsvp-consent').focus(); return; }
  const notes = $('#rsvp-notes').value.trim();
  fields.disabled = true;
  status.textContent = 'Visszajelzés küldése…';
  try {
    const data = await api({ action: 'rsvp', token, attending, plusOneComing, plusOneName, notes });
    if (!data.ok) throw Error(data.error === 'closed' ? 'A visszajelzés most szünetel. Próbáld újra később.' : data.error === 'busy' ? 'Sokan küldenek egyszerre. Próbáld újra pár másodperc múlva.' : 'Nem sikerült elküldeni. Próbáld újra, vagy szólj közvetlenül a házigazdának.');
    guest = data.guest; event = data.event;
    notifyByEmail();
    status.textContent = '';
    renderEvent();
    showSuccess(true);
  } catch (err) {
    status.textContent = err.name === 'TimeoutError' || err instanceof TypeError ? 'Hálózati hiba. Próbáld újra.' : err.message;
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
    'Esemény': 'The Thirty Club · 30th in the 30s',
    _subject: `Thirty Club · ${guest.name}: ${guest.response === 'yes' ? 'jön' : 'nem jön'}`,
    _template: 'table', _honey: ''
  };
  fetch('https://formsubmit.co/ajax/' + encodeURIComponent(config.formId), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function showSuccess(focus) {
  const yes = guest.response === 'yes';
  const name = `<em>${esc(guest.name.toUpperCase())}</em>`;
  let msg;
  if (yes) {
    const who = guest.plusOneComing ? `KETTEN JÖTTÖK ${esc((guest.plusOneName || '').toUpperCase())} ÉS TE` : 'EGY HELY FOGLALVA NEKED';
    msg = `KEDVES ${name} STOP VISSZAJELZÉSED MEGÉRKEZETT STOP ${who} STOP ÖLTÖNY ÉS ESTÉLYI KÖTELEZŐ STOP TALÁLKOZUNK A KLUBBAN STOP`;
  } else {
    msg = `KEDVES ${name} STOP KÁR HOGY NEM JÖSSZ STOP EGY POHARAT ÉRTED IS FELEMELÜNK STOP HA MÉGIS JÖNNÉL ITT MÓDOSÍTHATOD STOP`;
  }
  $('#tg-text').innerHTML = msg;
  const showCal = yes && !!event.start;
  $('#calendar-actions').hidden = !showCal;
  if (showCal) {
    const p = new URLSearchParams({ action: 'TEMPLATE', text: 'The Thirty Club · 30th in the 30s', dates: `${calDate(event.start)}/${calDate(event.start)}`, location: location_(), details: calDetails(), ctz: 'Europe/Budapest' });
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
const calDetails = () => ['Dress code: harmincas évek (öltöny, szmoking, estélyi).', 'Jelszó az ajtónál: „Swing harminc”.', event.note || '', location.href].filter(Boolean).join('\n');
function escapeICS(v) { return v.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
// UTF-8 bájtok szerint tördelünk (RFC 5545, Apple Naptár).
function fold(line) { let out = '', n = 0; for (const ch of line) { const len = new TextEncoder().encode(ch).length; if (n + len > 75) { out += '\r\n '; n = 1; } out += ch; n += len; } return out; }
$('#apple-calendar').addEventListener('click', () => {
  if (!event?.start) return;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Thirty Club//Invitation//HU', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:thirty-club-${calDate(event.start)}@invitation.local`, `DTSTAMP:${calDate(new Date())}`, `DTSTART:${calDate(event.start)}`, 'SUMMARY:The Thirty Club · 30th in the 30s', `LOCATION:${escapeICS(location_())}`, `DESCRIPTION:${escapeICS(calDetails())}`, 'END:VEVENT', 'END:VCALENDAR'];
  const url = URL.createObjectURL(new Blob([lines.map(fold).join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'thirty-club.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});

boot();
