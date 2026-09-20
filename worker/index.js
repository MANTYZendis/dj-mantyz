/* ==========================================================
   Odesílání poptávek z djmantyz.cz

   Běží jako Cloudflare Worker. Stránka sem pošle vyplněný formulář
   a worker z něj udělá dva e-maily přes službu Resend:

     1) poptávku Matějovi  (odpovědět na ni jde rovnou zákazníkovi)
     2) potvrzení zákazníkovi, že zpráva dorazila

   Proč takhle a ne přes hotovou službu na formuláře:
   hotové služby odesílají z vlastních serverů, takže potvrzení padalo
   zákazníkům do spamu, a po odeslání odváděly návštěvníka na cizí
   ověřovací stránku. Tady oba maily odcházejí z djmantyz.cz a
   návštěvník zůstane celou dobu na webu.

   Tajný klíč k Resendu NENÍ v tomhle souboru — je uložený zvlášť
   jako proměnná RESEND_API_KEY v nastavení workeru.
   ========================================================== */

const KAM_CHODI_POPTAVKY = "mantyz.djwork@gmail.com";
const ODESILATEL = "DJ MANTYZ <info@djmantyz.cz>";
const TELEFON = "+420 704 794 222";

// Odkud smí stránka volat. Cokoliv jiného worker odmítne.
const POVOLENE_WEBY = [
  "https://djmantyz.cz",
  "https://www.djmantyz.cz",
];

export default {
  async fetch(request, env) {
    const puvod = request.headers.get("Origin") || "";
    const hlavicky = hlavickyCORS(puvod);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: hlavicky });
    }
    if (request.method !== "POST") {
      return odpoved({ ok: false, chyba: "Špatná metoda" }, 405, hlavicky);
    }
    if (!POVOLENE_WEBY.includes(puvod)) {
      return odpoved({ ok: false, chyba: "Nepovolený původ" }, 403, hlavicky);
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return odpoved({ ok: false, chyba: "Nečitelná data" }, 400, hlavicky);
    }

    // Past na roboty: schované políčko, které člověk nevyplní.
    if (data.web) {
      return odpoved({ ok: true }, 200, hlavicky);   // robotovi řekneme, že je vše v pořádku
    }

    const jmeno = orez(data.jmeno, 100);
    const email = orez(data.email, 150);
    const telefon = orez(data.telefon, 50);
    const datum = orez(data.datum, 30);
    const misto = orez(data.misto, 120);
    const typ = orez(data.typ, 60) || "Neuvedeno";
    const zprava = orez(data.zprava, 3000);

    if (!jmeno || !platnyEmail(email)) {
      return odpoved({ ok: false, chyba: "Chybí jméno nebo platný e-mail" }, 400, hlavicky);
    }

    const shrnuti = [
      `Jméno: ${jmeno}`,
      `E-mail: ${email}`,
      `Telefon: ${telefon || "neuveden"}`,
      `Typ akce: ${typ}`,
      `Datum: ${datum || "neuvedeno"}`,
      `Místo: ${misto || "neuvedeno"}`,
      "",
      zprava || "(bez zprávy)",
    ].join("\n");

    // Poptávku si nejdřív uložíme. I kdyby pak selhalo odesílání mailu,
    // nesmí se ztratit — bez toho by zákazník napsal a nikdo by to nevěděl.
    let cislo = null;
    try {
      const zapis = await env.DB.prepare(
        `INSERT INTO poptavky (prijato, jmeno, email, telefon, typ, datum_akce, misto, zprava, ip_zeme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        new Date().toISOString(),
        jmeno, email, telefon || null, typ,
        datum || null, misto || null, zprava || null,
        request.headers.get("CF-IPCountry") || null
      ).run();
      cislo = zapis.meta?.last_row_id ?? null;
    } catch (e) {
      // Uložení selhalo — poptávku pošleme aspoň mailem a chybu si poznamenáme.
      console.error("Zápis do databáze selhal:", e);
    }

    try {
      // 1) poptávka Matějovi — odpověď půjde rovnou zákazníkovi
      await posliMail(env, {
        from: ODESILATEL,
        to: [KAM_CHODI_POPTAVKY],
        reply_to: [email],
        subject: `Poptávka${cislo ? " č. " + cislo : ""}: ${typ}${datum ? " — " + datum : ""}`,
        text: shrnuti,
      });

      // 2) potvrzení zákazníkovi
      await posliMail(env, {
        from: ODESILATEL,
        to: [email],
        reply_to: [KAM_CHODI_POPTAVKY],
        subject: "Vaše poptávka mi dorazila — DJ MANTYZ",
        text:
          `Dobrý den,\n\n` +
          `vaše poptávka mi dorazila, díky za ni. Ozvu se vám do 24 hodin ` +
          `s konkrétní nabídkou.\n\n` +
          `Tohle je automatické potvrzení, že se formulář opravdu odeslal — ` +
          `odpovídat na něj nemusíte. Kdyby něco spěchalo, volejte rovnou ` +
          `na ${TELEFON}.\n\n` +
          `Co jsem od vás dostal:\n${shrnuti}\n\n` +
          `Matěj — DJ MANTYZ\nhttps://djmantyz.cz`,
      });

      return odpoved({ ok: true }, 200, hlavicky);
    } catch (e) {
      return odpoved({ ok: false, chyba: String(e.message || e) }, 502, hlavicky);
    }
  },
};

async function posliMail(env, zprava) {
  const odpoved = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(zprava),
  });
  if (!odpoved.ok) {
    throw new Error("Resend: " + (await odpoved.text()).slice(0, 200));
  }
  return odpoved.json();
}

function hlavickyCORS(puvod) {
  return {
    "Access-Control-Allow-Origin": POVOLENE_WEBY.includes(puvod) ? puvod : POVOLENE_WEBY[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function odpoved(telo, stav, hlavicky) {
  return new Response(JSON.stringify(telo), {
    status: stav,
    headers: { ...hlavicky, "Content-Type": "application/json; charset=utf-8" },
  });
}

function orez(hodnota, delka) {
  return String(hodnota == null ? "" : hodnota).trim().slice(0, delka);
}

function platnyEmail(hodnota) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(hodnota);
}
