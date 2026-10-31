/* A meghívó összes szövege egy helyen. Az admin „Szövegek” része ebből épül fel,
   a mentett változtatások a Google Táblázat „Szövegek” lapjára kerülnek.
   Típusok: text (alap), list (soronként egy tétel), program (soronként „Cím | leírás”), attr (mező helyőrző), dyn (szkript használja). */
(function () {
  const G = (group, items) => items.map(([k, label, d, type, vars]) => ({ k, group, label, d, type: type || 'text', vars: vars || '' }));
  const TEXTS = [
    ...G('Fejléc és nyitókép', [
      ['page.title', 'Böngészőfül címe (link nélkül)', '30th in the 30s', 'dyn'],
      ['page.title.guest', 'Böngészőfül címe (meghívóval)', '{név} · 30th in the 30s', 'dyn', '{név}'],
      ['brand.mark', 'Logó a bal felső sarokban', '30'],
      ['brand.tag', 'Logó melletti felirat', 'Private invitation'],
      ['brand.edition', 'Jobb felső felirat', '1996 ◆ 2026'],
      ['hero.eyebrow.closed', 'Kis felirat a cím fölött (link nélkül)', 'Zártkörű est · Est. 1996', 'dyn'],
      ['hero.eyebrow.invited', 'Kis felirat a cím fölött (meghívóval)', 'Személyes meghívó · Est. 1996', 'dyn'],
      ['hero.welcome', 'A cím fölötti sor', 'Welcome to'],
      ['hero.title', 'Főcím', '30th in the 30s'],
      ['hero.tagline', 'Alcím', 'Születésnap a harmincas évek stílusában'],
      ['hero.lede', 'Megszólítás a boríték fölött', 'Kedves {név}, a klub ajtaja nyitva áll előtted.', 'dyn', '{név}']
    ]),
    ...G('Zárt ajtó (link nélkül vagy hibás linkkel)', [
      ['door.none.title', 'Link nélkül: cím', 'Csak meghívóval', 'dyn'],
      ['door.none.text', 'Link nélkül: szöveg', 'Ez egy zártkörű est. Az ajtó a személyes meghívó linkjével nyílik, amit a házigazdától kaptál.', 'dyn'],
      ['door.unknown.title', 'Ismeretlen link: cím', 'Ismeretlen meghívó', 'dyn'],
      ['door.unknown.text', 'Ismeretlen link: szöveg', 'Ezt a meghívót nem találjuk. Ellenőrizd, hogy a teljes linket nyitottad-e meg, vagy kérj újat a házigazdától.', 'dyn'],
      ['door.error.title', 'Betöltési hiba: cím', 'Hiba', 'dyn'],
      ['door.error.text', 'Betöltési hiba: szöveg', 'A meghívót most nem sikerült betölteni. Próbáld újra pár perc múlva.', 'dyn']
    ]),
    ...G('Boríték', [
      ['env.admit', 'Felirat a levél tetején', 'Admit one'],
      ['env.sub', 'Felirat a név alatt', '30th in the 30s'],
      ['env.open', 'Nyitó gomb', 'Töltsd fel a poharad, nyisd ki'],
      ['env.opened', 'Nyitó gomb kinyitás után', 'A meghívód', 'dyn']
    ]),
    ...G('Meghívó szöveg', [
      ['inv.eyebrow', 'Kis felirat', 'The invitation'],
      ['inv.greeting', 'Megszólítás', 'Kedves {név}!', 'dyn', '{név}'],
      ['inv.p1', 'Első bekezdés', 'Harminc leszek, és ezt úgy ünnepeljük, ahogy a harmincas években szokás volt: jazzel, swinggel, pezsgővel, és estélyi nélkül senki nem lép be a klubba.'],
      ['inv.p2', 'Második bekezdés', 'Öltözz úgy, mintha **1930-at írnánk**, és hozd a legjobb táncos lépéseidet. Lesz pezsgő, swing, torta, és egy este, amire harminc év múlva is emlékezni fogunk.'],
      ['inv.p3', 'Harmadik bekezdés (üresen nem jelenik meg)', '']
    ]),
    ...G('Belépőjegy', [
      ['ticket.eyebrow', 'Kis felirat', 'Admit one'],
      ['ticket.heading', 'Cím', 'A belépőjegyed'],
      ['ticket.top', 'Jegy fejléce', '30th in the 30s'],
      ['ticket.no', 'Jegy sorszáma', 'No. 030'],
      ['ticket.guest', 'Mező: vendég', 'Vendég'],
      ['ticket.when', 'Mező: időpont', 'Mikor'],
      ['ticket.where', 'Mező: helyszín', 'Hol'],
      ['ticket.pw.label', 'Mező: jelszó', 'Jelszó az ajtónál'],
      ['ticket.pw', 'A jelszó', '„Swing harminc”'],
      ['ticket.plus.maybe', 'Ha hozhat partnert', 'partnerrel együtt is jöhetsz', 'dyn'],
      ['ticket.plus.with', 'Ha partnerrel jön', 'és {partner}', 'dyn', '{partner}'],
      ['ticket.tbd', 'Ha még nincs dátum vagy helyszín', 'Hamarosan', 'dyn'],
      ['ticket.tbd.note', 'Ha még nincs dátum: magyarázat', 'A pontos időpontot itt fogod látni.', 'dyn'],
      ['ticket.time', 'Kezdés formátuma', '{idő}-tól', 'dyn', '{idő}'],
      ['ticket.map', 'Térkép link', 'Térkép ↗']
    ]),
    ...G('Az est menete', [
      ['prog.eyebrow', 'Kis felirat', 'The evening'],
      ['prog.heading', 'Cím', 'Az est menete'],
      ['prog.list', 'Programpontok', 'Érkezés | Pezsgő és welcome koktél. A jelszót ne felejtsd otthon.\nPohárköszöntő | Pár szó a harminc évről, aztán koccintás.\nVacsora | Asztalhoz ülünk, ahogy egy rendes klubestén illik.\nTorta | Pontosan harminc gyertya. Kívánni ér.\nSwing hajnalig | Tánc, koktélok, régi lemezek és mai slágerek swing-hangszerelésben.', 'program']
    ]),
    ...G('Dress code', [
      ['dress.eyebrow', 'Kis felirat', 'Dress code'],
      ['dress.heading', 'Cím', 'Öltözz ki'],
      ['dress.men.title', 'Első oszlop címe', 'Uraknak'],
      ['dress.men', 'Első oszlop tételei', 'Háromrészes öltöny vagy szmoking\nCsokornyakkendő vagy keskeny, mintás nyakkendő\nNadrágtartó, zsebóra, díszzsebkendő\nKalap, ha van: fedora vagy homburg\nHátrafésült, fényes haj', 'list'],
      ['dress.women.title', 'Második oszlop címe', 'Hölgyeknek'],
      ['dress.women', 'Második oszlop tételei', 'Hosszú, ferdén szabott szatén- vagy selyemruha\nHullámos frizura vagy oldalra fésült loknik\nGyöngysor, hosszú kesztyű, stóla\nVörös rúzs, vékony ívű szemöldök\nPántos, alacsony sarkú tánccipő', 'list'],
      ['dress.aside', 'Tipp alatta', 'Tipp: a rojtos, flitteres charleston-ruha a húszas évek. A harmincas évek hosszabb, karcsúbb és fényesebb.']
    ]),
    ...G('Visszajelzés űrlap', [
      ['rsvp.eyebrow', 'Kis felirat', 'R.S.V.P.'],
      ['rsvp.heading', 'Cím', 'Számíthatunk rád?'],
      ['rsvp.attend', 'Kérdés', 'Ott leszel?'],
      ['rsvp.yes', 'Igen gomb', 'Ott leszek'],
      ['rsvp.no', 'Nem gomb', 'Sajnos nem jutok el'],
      ['rsvp.plus', 'Partner kérdés', 'Hozol partnert?'],
      ['rsvp.plus.no', 'Partner: nem', 'Egyedül jövök'],
      ['rsvp.plus.yes', 'Partner: igen', 'Párommal jövök'],
      ['rsvp.plus.name', 'Partner neve mező', 'A partnered neve'],
      ['rsvp.plus.ph', 'Partner neve mező példaszövege', 'pl. Kovács Anna', 'attr'],
      ['rsvp.notes', 'Megjegyzés mező', 'Ételérzékenység, dalkérés'],
      ['rsvp.optional', 'Megjegyzés mező kiegészítése', '(nem kötelező)'],
      ['rsvp.notes.ph', 'Megjegyzés mező példaszövege', 'pl. laktózmentes · Sing, Sing, Sing', 'attr'],
      ['rsvp.consent', 'Hozzájárulás', 'Hozzájárulok, hogy a szervező a válaszomat és a megjegyzésemet az est szervezéséhez kezelje.'],
      ['rsvp.submit', 'Küldés gomb', 'Visszajelzés küldése ↗']
    ]),
    ...G('Visszajelzés üzenetek', [
      ['msg.closed.form', 'Ha a visszajelzés zárva van', 'A visszajelzés most szünetel. Hamarosan újra megnyílik.', 'dyn'],
      ['msg.partner', 'Hiányzik a partner neve', 'Írd be a partnered nevét, hogy a jegyére is ráírhassuk.', 'dyn'],
      ['msg.consent', 'Nincs bepipálva a hozzájárulás', 'A küldéshez pipáld be a hozzájárulást.', 'dyn'],
      ['msg.sending', 'Küldés közben', 'Visszajelzés küldése…', 'dyn'],
      ['msg.closed', 'Küldéskor zárva', 'A visszajelzés most szünetel. Próbáld újra később.', 'dyn'],
      ['msg.busy', 'Túl sokan küldenek egyszerre', 'Sokan küldenek egyszerre. Próbáld újra pár másodperc múlva.', 'dyn'],
      ['msg.error', 'Egyéb hiba', 'Nem sikerült elküldeni. Próbáld újra, vagy szólj közvetlenül a házigazdának.', 'dyn'],
      ['msg.network', 'Hálózati hiba', 'Hálózati hiba. Próbáld újra.', 'dyn']
    ]),
    ...G('Távirat (a visszajelzés után)', [
      ['tg.head', 'Fejléc bal oldalt', 'Távirat'],
      ['tg.head2', 'Fejléc jobb oldalt', '30th in the 30s'],
      ['tg.yes.solo', 'Ha egyedül jön', 'KEDVES {név} STOP VISSZAJELZÉSED MEGÉRKEZETT STOP EGY HELY FOGLALVA NEKED STOP ÖLTÖNY ÉS ESTÉLYI KÖTELEZŐ STOP TALÁLKOZUNK A KLUBBAN STOP', 'dyn', '{név}'],
      ['tg.yes.pair', 'Ha partnerrel jön', 'KEDVES {név} STOP VISSZAJELZÉSED MEGÉRKEZETT STOP KETTEN JÖTTÖK {partner} ÉS TE STOP ÖLTÖNY ÉS ESTÉLYI KÖTELEZŐ STOP TALÁLKOZUNK A KLUBBAN STOP', 'dyn', '{név}, {partner}'],
      ['tg.no', 'Ha nem jön', 'KEDVES {név} STOP KÁR HOGY NEM JÖSSZ STOP EGY POHARAT ÉRTED IS FELEMELÜNK STOP HA MÉGIS JÖNNÉL ITT MÓDOSÍTHATOD STOP', 'dyn', '{név}'],
      ['tg.gcal', 'Google Naptár gomb', 'Google Naptár ↗'],
      ['tg.ics', 'Apple Naptár gomb', 'Apple Naptár · .ics ↓'],
      ['tg.edit', 'Módosítás gomb', 'Módosítom a válaszom'],
      ['tg.editnote', 'Megjegyzés a gombok alatt', 'A válaszodat az est előtt bármikor módosíthatod ezen a linken.']
    ]),
    ...G('Lábléc és naptár', [
      ['foot.brand', 'Lábléc címe', '30th in the 30s'],
      ['foot.line', 'Lábléc alsó sora', '1996 · 2026'],
      ['cal.title', 'Naptárbejegyzés címe', '30th in the 30s', 'dyn'],
      ['cal.details', 'Naptárbejegyzés leírása', 'Dress code: harmincas évek (öltöny, szmoking, estélyi).\nJelszó az ajtónál: „Swing harminc”.', 'dyn']
    ]),
    ...G('Meghívó üzenet (az admin „Üzenet” gombja)', [
      ['admin.message', 'A másolt üzenet', 'Szia {név}! Harminc leszek, és ezt a harmincas évek stílusában ünnepeljük: 30th in the 30s. Itt a személyes meghívód, kérlek, jelezz vissza rajta: {link}', 'dyn', '{név}, {link}']
    ])
  ];
  const DEFAULTS = Object.fromEntries(TEXTS.map(t => [t.k, t.d]));
  let over = {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Egyszerű formázás: **félkövér**, sortörés.
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const fill = (s, vars, wrap) => s.replace(/\{([^{}]+)\}/g, (m, k) => (vars && k in vars ? (wrap ? wrap(vars[k]) : vars[k]) : m));

  const T = {
    list: TEXTS,
    defaults: DEFAULTS,
    esc, rich,
    set(o) { over = o && typeof o === 'object' ? o : {}; },
    raw(k) { return k in over ? String(over[k]) : (DEFAULTS[k] ?? ''); },
    get(k, vars) { return fill(T.raw(k), vars); },
    // HTML-be illesztve: a változók kiemelve (pl. a név a táviratban).
    html(k, vars, wrapTag) { return fill(rich(T.raw(k)), vars && Object.fromEntries(Object.entries(vars).map(([a, b]) => [a, esc(b)])), wrapTag ? v => `<${wrapTag}>${v}</${wrapTag}>` : null); },
    apply(root) {
      (root || document).querySelectorAll('[data-t]').forEach(el => {
        const k = el.dataset.t, v = T.raw(k), def = TEXTS.find(t => t.k === k);
        const type = def ? def.type : 'text';
        if (el.dataset.tAttr) { el.setAttribute(el.dataset.tAttr, v); return; }
        if (type === 'list') {
          el.replaceChildren(...v.split('\n').map(s => s.trim()).filter(Boolean).map(s => { const li = document.createElement('li'); li.innerHTML = rich(s); return li; }));
        } else if (type === 'program') {
          const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
          el.replaceChildren(...v.split('\n').map(s => s.trim()).filter(Boolean).map((line, i) => {
            const [title, ...rest] = line.split('|');
            const li = document.createElement('li');
            li.innerHTML = `<span class="no" aria-hidden="true">${roman[i] || i + 1}</span><div><h3>${rich(title.trim())}</h3>${rest.length ? `<p>${rich(rest.join('|').trim())}</p>` : ''}</div>`;
            return li;
          }));
        } else el.innerHTML = rich(v);
        el.hidden = !v.trim();
      });
    }
  };
  window.TC = T;
})();
