// Shared by server and the static (GitHub Pages) build.
export const norm = (a) => String(a ?? '').toUpperCase().replace(/[^A-Z0-9,]/g, '');

export const HINTS = {
  r1_safe: [
    'Der Zettel auf dem Schreibtisch spricht von Newton und dem Licht – also vom Farbspektrum.',
    'Nur Spektralfarben zählen (Braun, Schwarz, Weiß, Grau sind Täuschung). Längste Wellenlänge zuerst: Rot, Orange, Gelb, Grün, Blau, Indigo, Violett.',
  ],
  r1_door: [
    'Die Notiz aus der Schublade: erste Hälfte = Winkel der Uhrzeiger, zweite Hälfte = hinter dem Gemälde.',
    'Der Stundenzeiger wandert 0,5° pro Minute weiter. Hinter dem Bild steht Morsecode für zwei Ziffern.',
  ],
  r2_terminal: [
    'Die Zahlen auf dem Zettel sind Ordnungszahlen chemischer Elemente.',
    'Schlage die Symbole im Periodensystem nach und hänge sie aneinander.',
  ],
  r2_cabinet: [
    'Rot und Blau bilden einen festen Block (Rot direkt vor Blau).',
    'Violett gerade, Blau ungerade: Prüfe, wo der Rot-Blau-Block überhaupt stehen kann.',
  ],
  r2_door: [
    'Die UV-Schrift ist eine Verschiebechiffre (Caesar).',
    'Zähle die Kolben auf dem Labortisch – nicht die im Regal – und verschiebe jeden Buchstaben so weit zurück.',
  ],
  r3_panel: [
    'Jeder Druck schaltet das Feld selbst und seine vier direkten Nachbarn um. Zweimal drücken hebt sich auf.',
    '„Licht jagen“: Drücke Zeile für Zeile jeweils das Feld unter jedem leuchtenden Feld. Was in der letzten Zeile übrig bleibt, verrät, welche Felder der ersten Zeile du vorher drücken musst.',
  ],
  r3_chart: [
    'Das Mondposter nummeriert den Zyklus – der Neumond ist die 0, danach zählt man hoch.',
    '„Die Sterne zählen nur bis Sieben“: Die vier Monde sind Ziffern im Oktalsystem. Rechne ins Dezimalsystem um.',
  ],
  r3_door: [
    'Die Sternkarte ist nicht mit einer festen Verschiebung verschlüsselt, sondern mit einem Schlüsselwort (Vigenère).',
    'Das Schlüsselwort ist GALILEI. Ziehe von jedem Geheimbuchstaben den Schlüsselbuchstaben ab (A=0, B=1, …).',
  ],
};
