/* ==========================================================
   DJ MANTYZ — skript
   Dvě věci: mobilní menu a odeslání poptávky.
   ========================================================== */

/* --- KAM CHODÍ POPTÁVKY ---
   MUJ_EMAIL se používá jako záloha (otevře poštovní program)
   a taky u odkazu "E-mail" v index.html. */
const MUJ_EMAIL = "info@djmantyz.cz";

/* --- ODESÍLÁNÍ FORMULÁŘE BEZ POŠTOVNÍHO PROGRAMU ---
   Vlož sem přístupový klíč z web3forms.com (registrace e-mailem, zdarma,
   klíč ti přijde do mailu). Jakmile tu klíč je, formulář odesílá sám
   a poptávka ti přijde na MUJ_EMAIL. Dokud je prázdný, funguje záloha přes mailto.

   Záměrně to NENÍ funkce na Vercelu — tenhle způsob funguje stejně
   na Vercelu, na vlastním serveru i kdekoliv jinde. Při stěhování
   webu se nemusí měnit nic. */
const WEB3FORMS_KLIC = "";


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
  const zprava = hodnota("zprava");

  const predmet = `Poptávka: ${typ}${datum ? " — " + naDatum(datum) : ""}`;

  const telo = [
    `Jméno: ${jmeno}`,
    `Kontakt: ${email || "neuveden"}`,
    `Typ akce: ${typ}`,
    `Datum: ${datum ? naDatum(datum) : "neuvedeno"}`,
    `Místo: ${misto || "neuvedeno"}`,
    "",
    zprava || "(bez zprávy)",
  ].join("\n");

  if (WEB3FORMS_KLIC) {
    odeslatNaServer(predmet, telo, jmeno, email);
  } else {
    otevritPostu(predmet, telo);
  }
}

/* Odešle poptávku na pozadí — návštěvník nemusí mít nastavený e-mail. */
function odeslatNaServer(predmet, telo, jmeno, email) {
  const tlacitko = document.querySelector(".form button[type=submit]");
  if (tlacitko) { tlacitko.disabled = true; tlacitko.textContent = "Odesílám…"; }

  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KLIC,
      subject: predmet,
      from_name: jmeno || "Poptávka z webu",
      replyto: email || undefined,
      message: telo,
    }),
  })
    .then((odpoved) => odpoved.json())
    .then((data) => {
      if (!data.success) throw new Error(data.message || "nepodařilo se odeslat");
      hlaska("Poptávka odešla. Ozvu se do 24 hodin.", "ok");
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
