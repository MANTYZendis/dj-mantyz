-- Poptávky z webu djmantyz.cz
CREATE TABLE IF NOT EXISTS poptavky (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  prijato     TEXT NOT NULL,              -- kdy dorazila (ISO čas)
  stav        TEXT NOT NULL DEFAULT 'nova', -- nova | vyrizuji | domluveno | odmitnuto
  jmeno       TEXT NOT NULL,
  email       TEXT NOT NULL,
  telefon     TEXT,
  typ         TEXT,
  datum_akce  TEXT,
  misto       TEXT,
  zprava      TEXT,
  poznamka    TEXT,                       -- moje vlastní poznámky k poptávce
  precteno    INTEGER NOT NULL DEFAULT 0,
  ip_zeme     TEXT                        -- odkud přišla, jen orientačně
);

CREATE INDEX IF NOT EXISTS idx_poptavky_prijato ON poptavky (prijato DESC);
CREATE INDEX IF NOT EXISTS idx_poptavky_stav ON poptavky (stav);

-- Odpovědi odeslané z aplikace, ať je vidět historie komunikace
CREATE TABLE IF NOT EXISTS odpovedi (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  poptavka   INTEGER NOT NULL REFERENCES poptavky(id) ON DELETE CASCADE,
  odeslano   TEXT NOT NULL,
  predmet    TEXT,
  text       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_odpovedi_poptavka ON odpovedi (poptavka);
