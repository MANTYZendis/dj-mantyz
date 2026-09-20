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
   Kliknutí na fotku v galerii ji otevře přes celou obrazovku.
   Zavírá se křížkem, klávesou Esc nebo kliknutím vedle fotky,
   přepíná se šipkami, tlačítky nebo švihnutím prstem. */
(function () {
  const lupa = document.getElementById("lupa");
  const obrazek = document.getElementById("lupa-foto");
  const popis = document.getElementById("lupa-popis");
  const fotky = Array.from(document.querySelectorAll(".galerie .foto img"));
  if (!lupa || !obrazek || !fotky.length) return;

  let kde = 0;

  function ukaz(index) {
    kde = (index + fotky.length) % fotky.length;
    const f = fotky[kde];
    obrazek.src = f.currentSrc || f.src;
    obrazek.alt = f.alt || "";
    if (popis) popis.textContent = f.alt || "";
    zrusPriblizeni();
  }

  /* --- Přiblížení: druhé kliknutí fotku zvětší, další ji vrátí zpátky. --- */
  function jePriblizeno() {
    return obrazek.classList.contains("priblizeno");
  }

  function zrusPriblizeni() {
    obrazek.classList.remove("priblizeno", "taham");
    obrazek.style.transformOrigin = "center center";
    lupa.classList.remove("zoom");
  }

  /* Spočítá, na které místo fotky uživatel ukázal (v procentech),
     aby se přiblížilo přesně tam, a ne doprostřed. */
  function nastavStred(x, y) {
    const r = obrazek.getBoundingClientRect();
    const px = Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100));
    const py = Math.min(100, Math.max(0, ((y - r.top) / r.height) * 100));
    obrazek.style.transformOrigin = px + "% " + py + "%";
  }

  obrazek.addEventListener("click", function (e) {
    e.stopPropagation();                 // ať klik na fotku nezavře prohlížeč
    if (jePriblizeno()) { zrusPriblizeni(); return; }
    nastavStred(e.clientX, e.clientY);
    obrazek.classList.add("priblizeno");
    lupa.classList.add("zoom");
  });

  // Při přiblížení se dá po fotce "jezdit" myší.
  obrazek.addEventListener("mousemove", function (e) {
    if (!jePriblizeno()) return;
    obrazek.classList.add("taham");
    nastavStred(e.clientX, e.clientY);
  });
  obrazek.addEventListener("mouseleave", () => obrazek.classList.remove("taham"));

  // Na dotykovém displeji posouvá prst.
  obrazek.addEventListener("touchmove", function (e) {
    if (!jePriblizeno()) return;
    obrazek.classList.add("taham");
    nastavStred(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function otevri(index) {
    ukaz(index);
    lupa.hidden = false;
    document.body.style.overflow = "hidden";   // stránka pod tím se nemá posouvat
    lupa.querySelector(".lupa-zavrit")?.focus();
  }

  function zavri() {
    zrusPriblizeni();
    lupa.hidden = true;
    document.body.style.overflow = "";
    obrazek.src = "";
  }

  fotky.forEach(function (f, i) {
    const ramecek = f.closest(".foto");
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
    if (e.key === "Escape") zavri();
    if (e.key === "ArrowLeft") ukaz(kde - 1);
    if (e.key === "ArrowRight") ukaz(kde + 1);
  });

  // Švihnutí prstem na mobilu.
  let zacatekX = null;
  lupa.addEventListener("touchstart", (e) => { zacatekX = e.changedTouches[0].clientX; }, { passive: true });
  lupa.addEventListener("touchend", function (e) {
    if (zacatekX === null) return;
    const posun = e.changedTouches[0].clientX - zacatekX;
    if (!jePriblizeno() && Math.abs(posun) > 50) ukaz(kde + (posun < 0 ? 1 : -1));
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
