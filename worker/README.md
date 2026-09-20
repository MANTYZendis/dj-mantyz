# Odesílání poptávek — Cloudflare Worker

Proč to není přes hotovou formulářovou službu: ty odesílají z vlastních
serverů, takže potvrzení padalo zákazníkům do spamu, a po odeslání
odváděly návštěvníka na cizí ověřovací stránku. Tenhle worker posílá
oba e-maily z domény djmantyz.cz a návštěvník zůstane na webu.

## Co je potřeba nastavit

1. **Účet u Resend** (resend.com) — zdarma, 3 000 e-mailů měsíčně.
2. **Ověřit doménu djmantyz.cz** v Resendu → vygeneruje DNS záznamy,
   které patří do Cloudflare DNS. Pozor na SPF: djmantyz.cz už jeden
   SPF záznam má (kvůli Cloudflare Email Routing). Dva SPF záznamy na
   jedné doméně jsou chyba — musí se sloučit do jednoho.
3. **API klíč z Resendu** vložit do workeru jako proměnnou
   `RESEND_API_KEY` (Settings → Variables and Secrets → typ Secret).
   Klíč nepatří do tohoto repozitáře.

## Nasazení

Dashboard: Workers & Pages → vytvořit worker → vložit obsah `index.js`
→ Deploy. Adresu workeru pak doplnit do `script.js` na webu
(konstanta `ADRESA_ODESILANI`).

## Omezení

- Přijímá jen požadavky z djmantyz.cz (kontrola hlavičky Origin).
- Past na roboty: skryté políčko `web`.
- Delší texty se ořezávají, e-mail se kontroluje na formát.
