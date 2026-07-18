/* ==========================================================
   DJ MANTYZ — skript
   Dvě věci: mobilní menu a odeslání poptávky do e-mailu.
   ========================================================== */

/* --- E-MAIL, KAM CHODÍ POPTÁVKY ---
   Změň si ho tady na jednom místě (a taky v index.html u odkazu "E-mail"). */
const MUJ_EMAIL = "dj.mantyz@gmail.com";


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


/* ---------- Odeslání poptávky ----------
   Nepoužívá žádnou externí službu. Z vyplněných políček složí text
   a otevře e-mailový program s předvyplněnou zprávou.
   Výhoda: funguje hned, nic se nenastavuje, nic se nerozbije.
   Až budeš chtít formulář, který odesílá sám, dá se sem doplnit
   služba typu Formspree nebo Web3Forms. */
function odeslatPoptavku(udalost) {
  udalost.preventDefault();

  const hodnota = (id) => (document.getElementById(id)?.value || "").trim();

  const jmeno  = hodnota("jmeno");
  const datum  = hodnota("datum");
  const misto  = hodnota("misto");
  const typ    = hodnota("typ");
  const zprava = hodnota("zprava");

  const predmet = `Poptávka: ${typ}${datum ? " — " + naDatum(datum) : ""}`;

  const telo = [
    `Jméno: ${jmeno}`,
    `Typ akce: ${typ}`,
    `Datum: ${datum ? naDatum(datum) : "neuvedeno"}`,
    `Místo: ${misto || "neuvedeno"}`,
    "",
    zprava || "(bez zprávy)",
  ].join("\n");

  window.location.href =
    `mailto:${MUJ_EMAIL}?subject=${encodeURIComponent(predmet)}&body=${encodeURIComponent(telo)}`;
}

/* Z 2026-08-15 udělá 15. 8. 2026 */
function naDatum(iso) {
  const [r, m, d] = iso.split("-");
  return `${Number(d)}. ${Number(m)}. ${r}`;
}
