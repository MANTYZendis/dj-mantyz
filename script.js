/* ==========================================================
   DJ MANTYZ — skript
   Dvě věci: mobilní menu a odeslání poptávky.
   ========================================================== */

/* --- KAM CHODÍ POPTÁVKY ---
   MUJ_EMAIL se používá jako záloha (otevře poštovní program)
   a taky u odkazu "E-mail" v index.html. */
const MUJ_EMAIL = "info@djmantyz.cz";

/* ---------- Mobilní menu ---------- */
function prepniMenu() {
  const hlavicka = document.querySelector(".hdr-in");
  const tlacitko = document.querySelector(".burger");
  if (!hlavicka || !tlacitko) return;

  const otevreno = hlavicka.classList.toggle("otevreno");
  tlacitko.setAttribute("aria-expanded", otevreno ? "true" : "false");
}

function zavriMenu() {
  const hlavicka = document.querySelector(".hdr-in");
  const tlacitko = document.querySelector(".burger");
  if (hlavicka) hlavicka.classList.remove("otevreno");
  if (tlacitko) tlacitko.setAttribute("aria-expanded", "false");
}

// Po kliknutí na odkaz v menu se menu samo zavře.
document.querySelectorAll(".nav a").forEach(function (odkaz) {
  odkaz.addEventListener("click", zavriMenu);
});


/* ---------- Nabídka, kam napsat e-mail ----------
   Dřív se rovnou spouštěl odkaz mailto:. Jenže komu v počítači není
   nastavený poštovní program (a to je většina lidí, co píšou přes
   webový Gmail), tomu kliknutí neudělalo vůbec nic. Proto se teď
   otevře nabídka a člověk si vybere — každá volba někam vede. */
function otevritPostu(predmet, telo) {
  const panel = document.getElementById("posta");
  if (!panel) {                       // kdyby panel v kódu chyběl
    window.location.href = mailtoOdkaz(predmet, telo);
    return;
  }

  const q = (id) => document.getElementById(id);
  const adr = encodeURIComponent(MUJ_EMAIL);
  const pre = encodeURIComponent(predmet);
  const tel = encodeURIComponent(telo);

  if (q("posta-gmail"))
    q("posta-gmail").href =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${adr}&su=${pre}&body=${tel}`;
  if (q("posta-outlook"))
    q("posta-outlook").href =
      `https://outlook.live.com/mail/0/deeplink/compose?to=${adr}&subject=${pre}&body=${tel}`;
  if (q("posta-seznam"))
    q("posta-seznam").href =
      `https://email.seznam.cz/newMessageScreen?to=${adr}&subject=${pre}&body=${tel}`;
  if (q("posta-program"))
    q("posta-program").href = mailtoOdkaz(predmet, telo);

  const kop = q("posta-kopirovat");
  if (kop) {
    kop.textContent = "Jen zkopírovat adresu";
    kop.onclick = function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(MUJ_EMAIL)
        .then(() => { kop.textContent = "Zkopírováno: " + MUJ_EMAIL; })
        .catch(() => {});
    };
  }

  panel.hidden = false;
  document.body.style.overflow = "hidden";
  q("posta-zavrit")?.focus();
}

function mailtoOdkaz(predmet, telo) {
  return `mailto:${MUJ_EMAIL}?subject=${encodeURIComponent(predmet)}` +
         (telo ? `&body=${encodeURIComponent(telo)}` : "");
}

(function () {
  const panel = document.getElementById("posta");
  if (!panel) return;
  const zavri = () => { panel.hidden = true; document.body.style.overflow = ""; };

  document.getElementById("posta-zavrit")?.addEventListener("click", zavri);
  panel.addEventListener("click", (e) => { if (e.target === panel) zavri(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) zavri();
  });
  // Po výběru se nabídka zavře sama.
  ["posta-gmail", "posta-outlook", "posta-seznam", "posta-program"].forEach(function (id) {
    document.getElementById(id)?.addEventListener("click", () => setTimeout(zavri, 100));
  });
})();

/* ---------- Prohlížeč fotek ----------
   Kliknutí na fotku ji otevře přes celou obrazovku. Přibližuje se jako
   ve Fotkách v telefonu nebo ve Windows:
     - kolečko myši / dva prsty  = plynulé přiblížení kolem kurzoru či prstů
     - tažení myší / prstem      = posun přiblížené fotky
     - dvojklik / dvojí klepnutí = přiblížit, podruhé vrátit zpátky
   Zavírá se křížkem, klávesou Esc nebo kliknutím vedle fotky, přepíná se
   šipkami, tlačítky nebo švihnutím prstem (když fotka není přiblížená). */
(function () {
  const lupa = document.getElementById("lupa");
  const obrazek = document.getElementById("lupa-foto");
  const popis = document.getElementById("lupa-popis");
  // Kromě galerie i portrét v sekci O mně a fotka u ozvučení akcí.
  const fotky = Array.from(document.querySelectorAll(".galerie .foto img, .omne-foto img, .ozv-foto img"));
  if (!lupa || !obrazek || !fotky.length) return;

  obrazek.draggable = false;

  const MAX = 5;               // nejvíc pětinásobné přiblížení
  let kde = 0;
  let s = 1, tx = 0, ty = 0;   // přiblížení a posun
  let zaklad = null;           // kde fotka leží, když není přiblížená

  function zmerZaklad() {
    const t = obrazek.style.transform;
    obrazek.style.transform = "none";
    zaklad = obrazek.getBoundingClientRect();
    obrazek.style.transform = t;
  }

  function vykresli(plynule) {
    obrazek.classList.toggle("plynule", !!plynule);
    obrazek.style.transform = s > 1 ? `translate(${tx}px, ${ty}px) scale(${s})` : "";
    lupa.classList.toggle("zoom", s > 1);
  }

  // Přiblížená fotka nesmí ujet z obrazovky; menší než obrazovka zůstane uprostřed.
  function ohranic() {
    if (s <= 1 || !zaklad) { s = 1; tx = 0; ty = 0; return; }
    const vw = lupa.clientWidth, vh = lupa.clientHeight;
    const w = zaklad.width * s, h = zaklad.height * s;
    tx = w <= vw ? (vw - w) / 2 - zaklad.left
                 : Math.min(-zaklad.left, Math.max(vw - w - zaklad.left, tx));
    ty = h <= vh ? (vh - h) / 2 - zaklad.top
                 : Math.min(-zaklad.top, Math.max(vh - h - zaklad.top, ty));
  }

  // Přiblíží tak, aby bod pod kurzorem (prstem) zůstal na místě.
  function priblizKolem(noveS, x, y, plynule) {
    if (!zaklad) zmerZaklad();
    noveS = Math.min(MAX, Math.max(1, noveS));
    const u = (x - zaklad.left - tx) / s;
    const v = (y - zaklad.top - ty) / s;
    s = noveS;
    tx = x - zaklad.left - s * u;
    ty = y - zaklad.top - s * v;
    ohranic();
    vykresli(plynule);
  }

  function zrusPriblizeni(plynule) {
    s = 1; tx = 0; ty = 0;
    vykresli(plynule);
  }

  function ukaz(index) {
    kde = (index + fotky.length) % fotky.length;
    const f = fotky[kde];
    zrusPriblizeni(false);
    zaklad = null;
    obrazek.src = f.currentSrc || f.src;
    obrazek.alt = f.alt || "";
    if (popis) popis.textContent = f.alt || "";
  }

  obrazek.addEventListener("load", () => { if (s === 1) zmerZaklad(); });
  window.addEventListener("resize", function () {
    if (lupa.hidden) return;
    zrusPriblizeni(false);
    zmerZaklad();
  });

  // Kolečko myši (a gesto dvěma prsty na touchpadu).
  lupa.addEventListener("wheel", function (e) {
    if (lupa.hidden) return;
    e.preventDefault();
    priblizKolem(s * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY, false);
  }, { passive: false });

  // Myš i prsty přes jednotné "pointer" události.
  const prsty = new Map();
  let gesto = null;
  let tahlo = false;                       // bylo to tažení, ne klepnutí
  let posledniKlep = { cas: 0, x: 0, y: 0 };

  function stredDvou() {
    const [a, b] = [...prsty.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
  }

  obrazek.addEventListener("pointerdown", function (e) {
    try { obrazek.setPointerCapture(e.pointerId); } catch (_) { /* ukazatel uz zmizel */ }
    prsty.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!zaklad) zmerZaklad();
    if (prsty.size === 1) {
      tahlo = false;
      gesto = { typ: "posun", x: e.clientX, y: e.clientY, tx0: tx, ty0: ty };
    } else if (prsty.size === 2) {
      const m = stredDvou();
      gesto = { typ: "stisk", d0: m.d || 1, s0: s,
                u: (m.x - zaklad.left - tx) / s, v: (m.y - zaklad.top - ty) / s };
      tahlo = true;
    }
  });

  obrazek.addEventListener("pointermove", function (e) {
    if (!prsty.has(e.pointerId) || !gesto) return;
    prsty.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesto.typ === "stisk" && prsty.size >= 2) {
      const m = stredDvou();
      s = Math.min(MAX, Math.max(1, gesto.s0 * m.d / gesto.d0));
      tx = m.x - zaklad.left - s * gesto.u;
      ty = m.y - zaklad.top - s * gesto.v;
      ohranic(); vykresli(false);
    } else if (gesto.typ === "posun") {
      const dx = e.clientX - gesto.x, dy = e.clientY - gesto.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) tahlo = true;
      if (s > 1) {
        tx = gesto.tx0 + dx; ty = gesto.ty0 + dy;
        ohranic(); vykresli(false);
      }
    }
  });

  function pustil(e) {
    prsty.delete(e.pointerId);
    if (prsty.size === 1) {            // ze dvou prstů zbyl jeden → posouvá dál
      const p = [...prsty.values()][0];
      gesto = { typ: "posun", x: p.x, y: p.y, tx0: tx, ty0: ty };
    } else if (prsty.size === 0) {
      gesto = null;
    }
  }

  obrazek.addEventListener("pointerup", function (e) {
    if (!prsty.has(e.pointerId)) return;
    const posledni = prsty.size === 1;
    pustil(e);
    if (!posledni || tahlo) return;
    // Dvojklik / dvojí klepnutí.
    const ted = Date.now();
    const blizko = Math.hypot(e.clientX - posledniKlep.x, e.clientY - posledniKlep.y) < 30;
    if (ted - posledniKlep.cas < 320 && blizko) {
      if (s > 1) zrusPriblizeni(true);
      else priblizKolem(2.5, e.clientX, e.clientY, true);
      posledniKlep.cas = 0;
    } else {
      posledniKlep = { cas: ted, x: e.clientX, y: e.clientY };
    }
  });
  obrazek.addEventListener("pointercancel", pustil);

  // Kliknutí na fotku prohlížeč nezavírá.
  obrazek.addEventListener("click", (e) => e.stopPropagation());

  function otevri(index) {
    ukaz(index);
    lupa.hidden = false;
    document.body.style.overflow = "hidden";   // stránka pod tím se nemá posouvat
    lupa.querySelector(".lupa-zavrit")?.focus();
  }

  function zavri() {
    zrusPriblizeni(false);
    lupa.hidden = true;
    document.body.style.overflow = "";
    obrazek.src = "";
    zaklad = null;
  }

  fotky.forEach(function (f, i) {
    const ramecek = f.closest(".foto, .omne-foto, .ozv-foto");
    if (!ramecek) return;
    ramecek.tabIndex = 0;
    ramecek.setAttribute("role", "button");
    ramecek.setAttribute("aria-label", "Zvětšit fotku: " + (f.alt || ""));
    ramecek.addEventListener("click", () => otevri(i));
    ramecek.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); otevri(i); }
    });
  });

  lupa.querySelector(".lupa-zavrit")?.addEventListener("click", zavri);
  lupa.querySelector(".lupa-zpet")?.addEventListener("click", () => ukaz(kde - 1));
  lupa.querySelector(".lupa-dal")?.addEventListener("click", () => ukaz(kde + 1));

  // Kliknutí do tmavé plochy vedle fotky zavírá.
  lupa.addEventListener("click", function (e) {
    if (e.target === lupa) zavri();
  });

  document.addEventListener("keydown", function (e) {
    if (lupa.hidden) return;
    const stredX = lupa.clientWidth / 2, stredY = lupa.clientHeight / 2;
    if (e.key === "Escape") zavri();
    else if (e.key === "ArrowLeft") ukaz(kde - 1);
    else if (e.key === "ArrowRight") ukaz(kde + 1);
    else if (e.key === "+" || e.key === "=") priblizKolem(s * 1.5, stredX, stredY, true);
    else if (e.key === "-") priblizKolem(s / 1.5, stredX, stredY, true);
    else if (e.key === "0") zrusPriblizeni(true);
  });

  // Švihnutí jedním prstem přepíná fotky — jen když není přiblížená.
  let zacatekX = null;
  lupa.addEventListener("touchstart", function (e) {
    zacatekX = e.touches.length === 1 ? e.touches[0].clientX : null;
  }, { passive: true });
  lupa.addEventListener("touchend", function (e) {
    if (zacatekX === null || s > 1 || e.touches.length) { zacatekX = null; return; }
    const posun = e.changedTouches[0].clientX - zacatekX;
    if (Math.abs(posun) > 50) ukaz(kde + (posun < 0 ? 1 : -1));
    zacatekX = null;
  }, { passive: true });
})();


/* ---------- Tlačítko E-mail v kontaktech ----------
   Nespoléhá se na to, že návštěvník má nastavený poštovní program.
   Zkusí ho otevřít, a když se nic nestane, nabídne stejný panel
   jako formulář. Kliknutí tak nikdy neskončí do prázdna. */
(function () {
  const odkaz = document.querySelector('.kk[href^="mailto:"]');
  if (!odkaz) return;

  odkaz.addEventListener("click", function (e) {
    e.preventDefault();
    otevritPostu("Poptávka termínu", "");
  });
})();


/* ---------- Odeslání poptávky ----------
   Posílá se na api.djmantyz.cz — vlastní adresa, ne cizí služba.
   Proto návštěvník po odeslání neskončí na cizí ověřovací stránce
   a potvrzení mu přijde z djmantyz.cz, takže nespadne do spamu. */
const ADRESA_ODESILANI = "https://api.djmantyz.cz";

(function () {
  const formular = document.getElementById("poptavka");
  if (!formular) return;

  const stav = document.getElementById("stav-formulare");
  const tlacitko = formular.querySelector("button[type=submit]");

  function hlaska(text) {
    if (!stav) return;
    stav.textContent = text;
    stav.className = "form-stav form-stav-chyba";
  }

  formular.addEventListener("submit", function (udalost) {
    udalost.preventDefault();

    if (!formular.checkValidity()) {
      formular.reportValidity();
      return;
    }

    const hodnota = (id) => (document.getElementById(id)?.value || "").trim();
    const data = {
      web: hodnota("web"),            // past na roboty
      jmeno: hodnota("jmeno"),
      email: hodnota("email"),
      telefon: hodnota("telefon"),
      datum: naDatum(hodnota("datum")),
      misto: hodnota("misto"),
      typ: hodnota("typ"),
      zprava: hodnota("zprava"),
    };

    if (stav) stav.textContent = "";
    if (tlacitko) { tlacitko.disabled = true; tlacitko.textContent = "Odesílám…"; }

    fetch(ADRESA_ODESILANI, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((odpoved) => odpoved.json().catch(() => ({})))
      .then((vysledek) => {
        if (!vysledek.ok) throw new Error(vysledek.chyba || "nepodařilo se odeslat");
        window.location.href = "/dekuji";
      })
      .catch(function () {
        hlaska("Odeslání se nepovedlo. Zkuste to prosím znovu, nebo mi napište přímo.");
        if (tlacitko) { tlacitko.disabled = false; tlacitko.textContent = "Odeslat poptávku"; }
        otevritPostu("Poptávka termínu", shrnutiProMail(data));
      });
  });

  function shrnutiProMail(d) {
    return [
      `Jméno: ${d.jmeno}`,
      `E-mail: ${d.email}`,
      `Telefon: ${d.telefon || "neuveden"}`,
      `Typ akce: ${d.typ}`,
      `Datum: ${d.datum || "neuvedeno"}`,
      `Místo: ${d.misto || "neuvedeno"}`,
      "",
      d.zprava || "(bez zprávy)",
    ].join("\n");
  }
})();

/* Z 2026-08-15 udělá 15. 8. 2026 */
function naDatum(iso) {
  if (!iso) return "";
  const [r, m, d] = iso.split("-");
  return `${Number(d)}. ${Number(m)}. ${r}`;
}
