/* ==========================================================
   DJ MANTYZ — skript
   Dvě věci: mobilní menu a odeslání poptávky.
   ========================================================== */

/* --- KAM CHODÍ POPTÁVKY ---
   MUJ_EMAIL se používá jako záloha (otevře poštovní program)
   a taky u odkazu "E-mail" v index.html. */
const MUJ_EMAIL = "info@djmantyz.cz";

/* --- ODESÍLÁNÍ FORMULÁŘE ---
   Poptávka jde přes FormSubmit. Proti Web3Forms umí zdarma poslat
   zákazníkovi potvrzení, že jeho zpráva dorazila — a o to nám jde:
   kdo vyplní formulář a nedostane nic, neví, jestli se to vůbec odeslalo.

   POZOR — jednorázová aktivace: po úplně prvním odeslání přijde na
   KAM_CHODI_POPTAVKY e-mail od FormSubmit s odkazem, na který je potřeba
   kliknout. Do té doby se poptávky nedoručují. Po aktivaci FormSubmit
   nabídne náhradní řetězec místo adresy — až ho budeš mít, přepiš ho sem
   místo e-mailu, ať adresa nesvítí přímo v kódu stránky.

   Nezávislé na hostingu: je to obyčejné volání ze stránky, takže po
   stěhování webu na vlastní server se nemusí měnit nic. */
const KAM_CHODI_POPTAVKY = "mantyz.djwork@gmail.com";


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


/* ---------- Odeslání poptávky ---------- */
function odeslatPoptavku(udalost) {
  udalost.preventDefault();

  const hodnota = (id) => (document.getElementById(id)?.value || "").trim();

  // Past na roboty: políčko je schované, člověk ho nevyplní.
  if (hodnota("web")) return;

  const jmeno  = hodnota("jmeno");
  const datum  = hodnota("datum");
  const misto  = hodnota("misto");
  const typ    = hodnota("typ");
  const email  = hodnota("email");
  const telefon = hodnota("telefon");
  const zprava = hodnota("zprava");

  const predmet = `Poptávka: ${typ}${datum ? " — " + naDatum(datum) : ""}`;

  const telo = [
    `Jméno: ${jmeno}`,
    `E-mail: ${email || "neuveden"}`,
    `Telefon: ${telefon || "neuveden"}`,
    `Typ akce: ${typ}`,
    `Datum: ${datum ? naDatum(datum) : "neuvedeno"}`,
    `Místo: ${misto || "neuvedeno"}`,
    "",
    zprava || "(bez zprávy)",
  ].join("\n");

  if (KAM_CHODI_POPTAVKY) {
    odeslatNaServer(predmet, telo, jmeno, email);
  } else {
    otevritPostu(predmet, telo);
  }
}

/* Odešle poptávku na pozadí — návštěvník nemusí mít nastavený e-mail.
   Zároveň si o odeslání řekne zákazníkovi do jeho schránky. */
function odeslatNaServer(predmet, telo, jmeno, email) {
  const tlacitko = document.querySelector(".form button[type=submit]");
  if (tlacitko) { tlacitko.disabled = true; tlacitko.textContent = "Odesílám…"; }

  const potvrzeni =
    "Dobrý den,\n\n" +
    "vaše poptávka mi dorazila, díky za ni. Ozvu se vám do 24 hodin " +
    "s konkrétní nabídkou.\n\n" +
    "Tohle je automatické potvrzení, že se formulář opravdu odeslal — " +
    "odpovídat na něj nemusíte. Kdyby něco hořelo, volejte rovnou " +
    "na +420 704 794 222.\n\n" +
    "Co jsem od vás dostal:\n" + telo + "\n\n" +
    "Matěj — DJ MANTYZ\n" +
    "https://djmantyz.cz";

  fetch("https://formsubmit.co/ajax/" + encodeURIComponent(KAM_CHODI_POPTAVKY), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: predmet,
      _captcha: "false",
      _template: "table",
      _autoresponse: potvrzeni,     // tohle dostane zákazník do své schránky
      name: jmeno || "Poptávka z webu",
      email: email,                 // adresa, na kterou jde potvrzení
      message: telo,
    }),
  })
    .then((odpoved) => odpoved.json())
    .then((data) => {
      const ok = data.success === true || data.success === "true";
      if (!ok) throw new Error(data.message || "nepodařilo se odeslat");
      hlaska("Poptávka odešla. Potvrzení máte v e-mailu, ozvu se do 24 hodin.", "ok");
      document.querySelector(".form")?.reset();
      if (tlacitko) tlacitko.textContent = "Odesláno";
    })
    .catch(() => {
      // Když se odeslání nepovede, návštěvník o poptávku nepřijde —
      // otevře se mu pošta s připravenou zprávou.
      hlaska("Odeslání se nepovedlo, otevírám e-mail. Nebo mi rovnou zavolejte.", "chyba");
      if (tlacitko) { tlacitko.disabled = false; tlacitko.textContent = "Odeslat poptávku"; }
      otevritPostu(predmet, telo);
    });
}

/* Záloha: otevře poštovní program s předvyplněnou zprávou. */
function otevritPostu(predmet, telo) {
  window.location.href =
    `mailto:${MUJ_EMAIL}?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(telo)}`;
}

function hlaska(text, druh) {
  const misto = document.getElementById("stav-formulare");
  if (!misto) return;
  misto.textContent = text;
  misto.className = "form-stav " + (druh === "ok" ? "form-stav-ok" : "form-stav-chyba");
}

/* Z 2026-08-15 udělá 15. 8. 2026 */
function naDatum(iso) {
  const [r, m, d] = iso.split("-");
  return `${Number(d)}. ${Number(m)}. ${r}`;
}


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


/* ---------- Kontakt na e-mail ----------
   Odkaz zůstává obyčejný mailto, takže na telefonu i na počítači
   s nastaveným poštovním programem se normálně otevře nová zpráva.
   Když ale návštěvník žádný poštovní program nastavený nemá,
   kliknutí by neudělalo nic — proto se adresa zároveň zkopíruje
   do schránky a dá se rovnou vložit do webového Gmailu. */
(function () {
  const odkaz = document.querySelector('.kk[href^="mailto:"]');
  if (!odkaz) return;

  const adresa = odkaz.getAttribute("href").replace("mailto:", "").split("?")[0];
  const popisek = odkaz.querySelector(".kk-k");
  if (!popisek) return;
  const puvodni = popisek.textContent;
  let cas = null;

  odkaz.addEventListener("click", function () {
    if (!navigator.clipboard) return;          // odkaz funguje dál i bez schránky
    navigator.clipboard.writeText(adresa).then(function () {
      popisek.textContent = "Adresa zkopírována";
      clearTimeout(cas);
      cas = setTimeout(() => { popisek.textContent = puvodni; }, 2500);
    }).catch(() => {});
  });
})();
