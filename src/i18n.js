export const strings = {
  en: {
    title: 'TinkerLARS', design: '3D design', circuits: 'Circuits', code: 'Code blocks',
    box: 'Box', cylinder: 'Cylinder', sphere: 'Sphere', cone: 'Cone', torus: 'Torus',
    solid: 'Solid', hole: 'Hole', group: 'Group (CSG)', del: 'Delete', exportStl: 'Export STL',
    move: 'Move', rotate: 'Rotate', scale: 'Scale', grid: 'Snap grid (mm)', duplicate: 'Duplicate',
    selectHint: 'Click a shape to select. Shift-click to select several.',
    addComponent: 'Add component', run: 'Start simulation', stop: 'Stop simulation',
    resistor: 'Resistor', led: 'LED', button: 'Push button', wire: 'Wire',
    from: 'From', to: 'To', value: 'Value', pressed: 'pressed', on: 'ON', off: 'off',
    arduinoCode: 'Generated Arduino code', current: 'current', language: 'Språk / Language',
    shape: 'Shape', props: 'Properties', empty: 'Nothing selected',
  },
  nb: {
    title: 'TinkerLARS', design: '3D-design', circuits: 'Kretser', code: 'Kodeblokker',
    box: 'Boks', cylinder: 'Sylinder', sphere: 'Kule', cone: 'Kjegle', torus: 'Torus',
    solid: 'Fast', hole: 'Hull', group: 'Grupper (CSG)', del: 'Slett', exportStl: 'Eksporter STL',
    move: 'Flytt', rotate: 'Roter', scale: 'Skaler', grid: 'Rutenett (mm)', duplicate: 'Dupliser',
    selectHint: 'Klikk en figur for å velge. Shift-klikk for å velge flere.',
    addComponent: 'Legg til komponent', run: 'Start simulering', stop: 'Stopp simulering',
    resistor: 'Motstand', led: 'LED', button: 'Trykknapp', wire: 'Ledning',
    from: 'Fra', to: 'Til', value: 'Verdi', pressed: 'trykket', on: 'PÅ', off: 'av',
    arduinoCode: 'Generert Arduino-kode', current: 'strøm', language: 'Språk / Language',
    shape: 'Figur', props: 'Egenskaper', empty: 'Ingenting valgt',
  },
};
let lang = 'nb';
export function setLang(l) { if (strings[l]) lang = l; }
export function getLang() { return lang; }
export function t(key) { return strings[lang][key] ?? strings.en[key] ?? key; }
