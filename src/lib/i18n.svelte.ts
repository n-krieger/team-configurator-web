/**
 * Translations. `en` is the reference: every other language must define the
 * same keys (enforced by the type). "{x}" is replaced by vars.x; "a|b" picks
 * the singular/plural form depending on vars.n.
 */

const en = {
  appName: 'Team Configurator',
  back: 'Back',
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  done: 'Done',
  close: 'Close',
  more: 'More',
  updated: 'Changed {date}',

  // home
  plans: 'Team plans',
  rosters: 'Player lists',
  newRoster: 'New player list',
  newPlan: 'New plan',
  import: 'Import',
  welcomeTitle: 'Fair teams, new pairings',
  welcomeText:
    'Create a player list, then let the app split your players into teams for several rounds, so that everyone plays with as many different team mates as possible and teams stay balanced.',
  welcomeImport: 'Got a file from another coach? Import it.',
  playersCount: '{n} player|{n} players',
  roundsCount: '{n} round|{n} rounds',

  // roster editor
  rosterName: 'Name of the list',
  rosterNamePlaceholder: 'e.g. U15 Tuesday',
  untitledRoster: 'Untitled list',
  positions: 'Positions',
  positionsHint:
    'Positions are spread evenly over the teams in this order, and the optimiser only swaps players with the same position.',
  addPosition: 'Add position',
  positionLabel: 'Position',
  moveUp: 'Move up',
  moveDown: 'Move down',
  remove: 'Remove',
  presets: 'Presets',
  presetThree: 'Goalkeeper · Defender · Forward',
  presetTwo: 'Goalkeeper · Field player',
  presetNone: 'No positions',
  goalkeeper: 'Goalkeeper',
  defender: 'Defender',
  forward: 'Forward',
  fieldPlayer: 'Field player',
  player: 'Player',
  applyPresetConfirm: 'Replace the positions with this preset?',
  players: 'Players',
  addPlayer: 'Add player',
  playerName: 'Name',
  strength: 'Strength',
  strengthHint: 'Relative strength, 1 = average. Used to balance the teams.',
  pasteList: 'Paste list',
  pasteHint:
    'One player per line. Position and strength are optional, e.g. "Anna Goalkeeper 1.2" or "Ben; Defender; 0,9".',
  pasteAdd: 'Add {n} player|Add {n} players',
  duplicateName: 'Name used twice',
  emptyName: 'Name missing',
  duplicatePosition: 'Position used twice',
  deleteRosterConfirm: 'Delete the list "{name}"? Plans made from it are kept.',
  duplicate: 'Duplicate',
  copySuffix: 'copy',
  createPlan: 'Create plan',
  shareFile: 'Send file',
  saveFile: 'Save file',
  noPlayersYet: 'No players yet.',

  // new plan
  planName: 'Name of the plan',
  roster: 'Player list',
  rounds: 'Rounds',
  teamsPerRound: 'Teams per round',
  playersPerTeam: '≈ {n} players per team',
  advanced: 'Optimisation settings',
  weightA: 'New pairings',
  weightAHint: 'Reward for every pair of players that ends up in the same team at least once.',
  weightB: 'Avoid repeated pairings',
  weightBHint: 'Penalty for pairs that play together more than once (grows quadratically).',
  weightC: 'Equal team strength',
  weightCHint: 'Penalty for differences in average team strength.',
  weightsHint: 'Only the ratio between the weights matters. 0 switches a criterion off.',
  restarts: 'Restarts',
  restartsHint: 'More restarts find better teams but take longer.',
  sameLimit: 'Patience',
  sameLimitHint: 'Iterations without improvement before a run stops.',
  resetDefaults: 'Reset to defaults',
  createAndGenerate: 'Create and generate',
  needRoster: 'Create a player list first.',
  fixRosterFirst: 'The player list has missing or duplicate names. Please fix it first.',
  tooManyTeams: 'More teams than players.',
  attendanceLater: 'You can mark absent players per round after creating the plan.',

  // plan view
  generate: 'Generate teams',
  regenerate: 'Regenerate',
  regenerateConfirm:
    'Regenerate {n} unlocked round?|Regenerate {n} unlocked rounds? Their current teams will be replaced.',
  nothingToGenerate: 'All rounds are locked. Unlock a round to regenerate it.',
  addRound: 'Add round',
  round: 'Round {n}',
  notGenerated: 'Not generated yet',
  generateRound: 'Generate this round',
  lock: 'Lock',
  unlock: 'Unlock',
  lockedHint: 'Locked rounds are kept when generating and still count for the pairings.',
  editRound: 'Players & teams',
  deleteRound: 'Delete round',
  deleteRoundConfirm: 'Delete round {n}?',
  team: 'Team',
  teamsCount: '{n} team|{n} teams',
  attending: '{n} of {m} players',
  swapHint: 'Tap a player in another team to swap with {name}.',
  swapped: 'Swapped {a} and {b}',
  pairings: 'Pairings',
  statsPlayed: '{u} of {t} possible pairs play together at least once',
  statsMissing: '{n} pair never in the same team|{n} pairs never in the same team',
  statsRepeated: '{n} pair together {k}×|{n} pairs together {k}×',
  score: 'Score',
  shareText: 'Share as text',
  copied: 'Copied to clipboard',
  planSettings: 'Plan settings',
  syncRoster: 'Get new players from list',
  syncDone: 'Added {n} new player|Added {n} new players',
  syncNone: 'No new players in "{name}".',
  syncMissing: 'The player list of this plan is not on this device.',
  deletePlanConfirm: 'Delete the plan "{name}"?',
  generating: 'Generating teams…',
  runOf: 'Run {r} of {n}',
  generateFailed: 'Generation failed: {msg}',
  absentPlayers: 'Absent: {names}',

  // round editor
  present: 'Present',
  all: 'All',
  none: 'None',
  roundChangeClears: 'Changing players or teams clears the generated teams of this round.',

  // import
  chooseFile: 'Choose file',
  orPaste: 'Or paste the content',
  pastePlaceholder: 'Paste CSV or a list of names…',
  readText: 'Read text',
  importHelpTitle: 'Got a file in WhatsApp, Signal or by mail?',
  importHelpIos: 'iPhone: open the file, tap Share → "Save to Files", then choose it here.',
  importHelpAndroid: 'Android: download the file, then choose it here (usually in "Downloads").',
  importHelpSpreadsheet:
    'You can also import a spreadsheet saved as CSV with the columns Name, Position and Strength.',
  previewRoster: 'Player list "{name}"',
  previewPlan: 'Plan "{name}"',
  saveAsNew: 'Save as new',
  replaceExisting: 'Replace my version',
  existsHint: 'You already have this (changed {date}). The file was changed {fileDate}.',
  alsoSaveRoster: 'Also save the player list',
  importedRoster: 'Player list imported',
  importedPlan: 'Plan imported',
  importedName: 'Imported list',
  errEmpty: 'The file is empty.',
  errUnknownFormat: 'This file is not a Team Configurator file.',
  errNewerVersion: 'This file was made with a newer version of the app. Please reload the app.',
  errNoPlayers: 'No players found in the file.',
  errUnknownPlayer: 'Unknown player "{d}" in a round.',
  errInvalidRound: 'A round in the file is invalid.',
  errRead: 'The file could not be read.',

  // settings
  settings: 'Settings',
  language: 'Language',
  privacy: 'Privacy',
  privacyText:
    'All data is stored only on this device. The app makes no network requests with your data: no account, no server, no tracking. Data leaves the device only when you send a file yourself — it is then as private as the channel you choose (WhatsApp and Signal are end-to-end encrypted).',
  storage: 'Storage',
  storagePersisted: 'Your browser keeps the data permanently.',
  storageNotPersisted:
    'Your browser may delete the data when storage runs low or the app is unused for a while (Safari: after 7 days unless the app is on the home screen). Send yourself the files as a backup.',
  install: 'Install on your phone',
  installText:
    'iPhone (Safari): Share → "Add to Home Screen". Android (Chrome): menu ⋮ → "Install app". The app then works offline.',
  deleteAll: 'Delete all data',
  deleteAllConfirm: 'Delete all player lists and plans on this device? This cannot be undone.',
  about: 'About',
  aboutText: 'Based on the team constellation generator by Selina Wetter and Nicolai Krieger.',
  shareFailed: 'Sharing failed.',
};

export type MessageKey = keyof typeof en;

const de: Record<MessageKey, string> = {
  appName: 'Team Configurator',
  back: 'Zurück',
  save: 'Speichern',
  cancel: 'Abbrechen',
  delete: 'Löschen',
  done: 'Fertig',
  close: 'Schliessen',
  more: 'Mehr',
  updated: 'Geändert {date}',

  plans: 'Teampläne',
  rosters: 'Spielerlisten',
  newRoster: 'Neue Spielerliste',
  newPlan: 'Neuer Plan',
  import: 'Importieren',
  welcomeTitle: 'Faire Teams, neue Kombinationen',
  welcomeText:
    'Erstelle eine Spielerliste und lass die App die Spieler für mehrere Runden in Teams einteilen – so spielt jede und jeder mit möglichst vielen verschiedenen Teamkollegen und die Teams bleiben ausgeglichen.',
  welcomeImport: 'Datei von einem anderen Coach erhalten? Importiere sie.',
  playersCount: '{n} Spieler|{n} Spieler',
  roundsCount: '{n} Runde|{n} Runden',

  rosterName: 'Name der Liste',
  rosterNamePlaceholder: 'z. B. U15 Dienstag',
  untitledRoster: 'Liste ohne Namen',
  positions: 'Positionen',
  positionsHint:
    'Die Positionen werden in dieser Reihenfolge gleichmässig auf die Teams verteilt. Getauscht werden nur Spieler mit gleicher Position.',
  addPosition: 'Position hinzufügen',
  positionLabel: 'Position',
  moveUp: 'Nach oben',
  moveDown: 'Nach unten',
  remove: 'Entfernen',
  presets: 'Vorlagen',
  presetThree: 'Torhüter · Verteidigung · Sturm',
  presetTwo: 'Torhüter · Feldspieler',
  presetNone: 'Keine Positionen',
  goalkeeper: 'Torhüter',
  defender: 'Verteidigung',
  forward: 'Sturm',
  fieldPlayer: 'Feldspieler',
  player: 'Spieler',
  applyPresetConfirm: 'Positionen durch diese Vorlage ersetzen?',
  players: 'Spieler',
  addPlayer: 'Spieler hinzufügen',
  playerName: 'Name',
  strength: 'Stärke',
  strengthHint: 'Relative Stärke, 1 = Durchschnitt. Dient zum Ausgleichen der Teams.',
  pasteList: 'Liste einfügen',
  pasteHint:
    'Ein Spieler pro Zeile. Position und Stärke sind optional, z. B. «Anna Torhüter 1.2» oder «Ben; Verteidigung; 0,9».',
  pasteAdd: '{n} Spieler hinzufügen|{n} Spieler hinzufügen',
  duplicateName: 'Name doppelt',
  emptyName: 'Name fehlt',
  duplicatePosition: 'Position doppelt',
  deleteRosterConfirm: 'Liste «{name}» löschen? Daraus erstellte Pläne bleiben erhalten.',
  duplicate: 'Duplizieren',
  copySuffix: 'Kopie',
  createPlan: 'Plan erstellen',
  shareFile: 'Datei senden',
  saveFile: 'Datei speichern',
  noPlayersYet: 'Noch keine Spieler.',

  planName: 'Name des Plans',
  roster: 'Spielerliste',
  rounds: 'Runden',
  teamsPerRound: 'Teams pro Runde',
  playersPerTeam: '≈ {n} Spieler pro Team',
  advanced: 'Optimierung',
  weightA: 'Neue Kombinationen',
  weightAHint: 'Belohnung für jedes Spielerpaar, das mindestens einmal im selben Team spielt.',
  weightB: 'Wiederholungen vermeiden',
  weightBHint: 'Abzug für Paare, die mehrmals zusammen spielen (wächst quadratisch).',
  weightC: 'Gleich starke Teams',
  weightCHint: 'Abzug für Unterschiede in der durchschnittlichen Teamstärke.',
  weightsHint: 'Nur das Verhältnis der Gewichte zählt. 0 schaltet ein Kriterium aus.',
  restarts: 'Neustarts',
  restartsHint: 'Mehr Neustarts finden bessere Teams, dauern aber länger.',
  sameLimit: 'Geduld',
  sameLimitHint: 'Iterationen ohne Verbesserung, bevor ein Durchlauf endet.',
  resetDefaults: 'Standardwerte',
  createAndGenerate: 'Erstellen und Teams bilden',
  needRoster: 'Erstelle zuerst eine Spielerliste.',
  fixRosterFirst: 'Die Spielerliste enthält fehlende oder doppelte Namen. Bitte zuerst korrigieren.',
  tooManyTeams: 'Mehr Teams als Spieler.',
  attendanceLater: 'Abwesende Spieler kannst du nach dem Erstellen pro Runde markieren.',

  generate: 'Teams bilden',
  regenerate: 'Neu bilden',
  regenerateConfirm:
    '{n} offene Runde neu bilden?|{n} offene Runden neu bilden? Die aktuellen Teams werden ersetzt.',
  nothingToGenerate: 'Alle Runden sind gesperrt. Entsperre eine Runde, um sie neu zu bilden.',
  addRound: 'Runde hinzufügen',
  round: 'Runde {n}',
  notGenerated: 'Noch keine Teams',
  generateRound: 'Diese Runde bilden',
  lock: 'Sperren',
  unlock: 'Entsperren',
  lockedHint: 'Gesperrte Runden bleiben beim Neu-Bilden erhalten und zählen weiterhin für die Kombinationen.',
  editRound: 'Spieler & Teams',
  deleteRound: 'Runde löschen',
  deleteRoundConfirm: 'Runde {n} löschen?',
  team: 'Team',
  teamsCount: '{n} Team|{n} Teams',
  attending: '{n} von {m} Spielern',
  swapHint: 'Tippe auf einen Spieler in einem anderen Team, um mit {name} zu tauschen.',
  swapped: '{a} und {b} getauscht',
  pairings: 'Kombinationen',
  statsPlayed: '{u} von {t} möglichen Paaren spielen mindestens einmal zusammen',
  statsMissing: '{n} Paar nie im selben Team|{n} Paare nie im selben Team',
  statsRepeated: '{n} Paar {k}× zusammen|{n} Paare {k}× zusammen',
  score: 'Bewertung',
  shareText: 'Als Text teilen',
  copied: 'In die Zwischenablage kopiert',
  planSettings: 'Plan-Einstellungen',
  syncRoster: 'Neue Spieler aus Liste holen',
  syncDone: '{n} neuer Spieler hinzugefügt|{n} neue Spieler hinzugefügt',
  syncNone: 'Keine neuen Spieler in «{name}».',
  syncMissing: 'Die Spielerliste dieses Plans ist auf diesem Gerät nicht vorhanden.',
  deletePlanConfirm: 'Plan «{name}» löschen?',
  generating: 'Teams werden gebildet…',
  runOf: 'Durchlauf {r} von {n}',
  generateFailed: 'Teams bilden fehlgeschlagen: {msg}',
  absentPlayers: 'Abwesend: {names}',

  present: 'Anwesend',
  all: 'Alle',
  none: 'Keine',
  roundChangeClears: 'Änderungen an Spielern oder Teams löschen die Teams dieser Runde.',

  chooseFile: 'Datei wählen',
  orPaste: 'Oder Inhalt einfügen',
  pastePlaceholder: 'CSV oder Namensliste einfügen…',
  readText: 'Text einlesen',
  importHelpTitle: 'Datei per WhatsApp, Signal oder Mail erhalten?',
  importHelpIos: 'iPhone: Datei öffnen, Teilen → «In Dateien sichern», dann hier auswählen.',
  importHelpAndroid: 'Android: Datei herunterladen, dann hier auswählen (meist unter «Downloads»).',
  importHelpSpreadsheet:
    'Du kannst auch eine als CSV gespeicherte Tabelle mit den Spalten Name, Position und Stärke importieren.',
  previewRoster: 'Spielerliste «{name}»',
  previewPlan: 'Plan «{name}»',
  saveAsNew: 'Als neu speichern',
  replaceExisting: 'Meine Version ersetzen',
  existsHint: 'Du hast diese Daten bereits (geändert {date}). Die Datei wurde {fileDate} geändert.',
  alsoSaveRoster: 'Spielerliste auch speichern',
  importedRoster: 'Spielerliste importiert',
  importedPlan: 'Plan importiert',
  importedName: 'Importierte Liste',
  errEmpty: 'Die Datei ist leer.',
  errUnknownFormat: 'Diese Datei ist keine Team-Configurator-Datei.',
  errNewerVersion: 'Diese Datei stammt aus einer neueren App-Version. Bitte lade die App neu.',
  errNoPlayers: 'In der Datei wurden keine Spieler gefunden.',
  errUnknownPlayer: 'Unbekannter Spieler «{d}» in einer Runde.',
  errInvalidRound: 'Eine Runde in der Datei ist ungültig.',
  errRead: 'Die Datei konnte nicht gelesen werden.',

  settings: 'Einstellungen',
  language: 'Sprache',
  privacy: 'Datenschutz',
  privacyText:
    'Alle Daten werden nur auf diesem Gerät gespeichert. Die App sendet deine Daten nirgendwohin: kein Konto, kein Server, kein Tracking. Daten verlassen das Gerät nur, wenn du selbst eine Datei verschickst – sie ist dann so privat wie der gewählte Kanal (WhatsApp und Signal sind Ende-zu-Ende-verschlüsselt).',
  storage: 'Speicher',
  storagePersisted: 'Dein Browser behält die Daten dauerhaft.',
  storageNotPersisted:
    'Dein Browser kann die Daten löschen, wenn der Speicher knapp wird oder die App länger nicht genutzt wird (Safari: nach 7 Tagen, ausser die App ist auf dem Home-Bildschirm). Schick dir die Dateien als Sicherung.',
  install: 'Auf dem Handy installieren',
  installText:
    'iPhone (Safari): Teilen → «Zum Home-Bildschirm». Android (Chrome): Menü ⋮ → «App installieren». Danach funktioniert die App auch offline.',
  deleteAll: 'Alle Daten löschen',
  deleteAllConfirm: 'Alle Spielerlisten und Pläne auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.',
  about: 'Über',
  aboutText: 'Basiert auf dem Team-Konstellations-Generator von Selina Wetter und Nicolai Krieger.',
  shareFailed: 'Teilen fehlgeschlagen.',
};

export const LANGUAGES = { en: 'English', de: 'Deutsch' } as const;
export type Lang = keyof typeof LANGUAGES;

const dictionaries: Record<Lang, Record<MessageKey, string>> = { en, de };
const STORAGE_KEY = 'team-configurator:lang';

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in dictionaries) return stored as Lang;
  } catch {
    // storage unavailable: fall through to the browser language
  }
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export const locale = $state({ lang: initialLang() });

export function setLang(lang: Lang): void {
  locale.lang = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // not persisted; the choice still applies for this session
  }
}

export function t(key: MessageKey, vars: Record<string, string | number> = {}): string {
  let message = dictionaries[locale.lang][key] ?? en[key];
  if (message.includes('|') && typeof vars.n === 'number') {
    const [one, other] = message.split('|');
    message = vars.n === 1 ? one : other;
  }
  return message.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale.lang === 'de' ? 'de-CH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString(locale.lang === 'de' ? 'de-CH' : 'en-GB', {
    maximumFractionDigits: digits,
  });
}
