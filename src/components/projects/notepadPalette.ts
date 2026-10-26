export const NOTEBOOK_PALETTES = [
    { label: 'Warm sketchbook', paper: '#e8dfca', rule: 'rgba(85, 97, 95, .16)', border: '#b7ae99', back: '#cfc3aa', stack: '#bcb59d', deepStack: '#9b9f8d', accent: '#8e5145', ink: '#303b3b', secondary: '#5c6460', tabs: ['#9baea2', '#d59b87', '#a9bac9', '#cfb675', '#b2a5b6'] },
    { label: 'Teal / cream / coral', paper: '#20373b', rule: 'rgba(236, 220, 186, .10)', border: 'rgba(236, 220, 186, .28)', back: '#29464a', stack: '#385457', deepStack: '#2b4448', accent: '#e3a18d' },
    { label: 'Indigo / lavender / yellow', paper: '#292e48', rule: 'rgba(192, 183, 225, .12)', border: 'rgba(192, 183, 225, .30)', back: '#343b58', stack: '#454b68', deepStack: '#363d58', accent: '#e7cc85' },
    { label: 'Charcoal / sage / terracotta', paper: '#303633', rule: 'rgba(180, 200, 170, .12)', border: 'rgba(180, 200, 170, .30)', back: '#3b443e', stack: '#4b574f', deepStack: '#3d4841', accent: '#dfa18a' },
    { label: 'Room colors', paper: '#fff7ea', rule: 'rgba(76, 90, 112, .13)', border: '#ddccb0', back: '#f1e4cc', stack: '#ddccb0', deepStack: '#c98d52', accent: '#a46a3d', ink: '#2c3646', secondary: '#4b5a70', tabs: ['#6fa0e6', '#a9cd62', '#ef7d6a', '#ffd76e', '#f59a45'] },
] as const;

export function notebookPaletteVariables(index: number): Record<string, string> {
    const palette = NOTEBOOK_PALETTES[index] ?? NOTEBOOK_PALETTES[0];
    const { label: _label, ...colors } = palette;
    const variables: Record<string, string> = {};
    for (const [key, color] of Object.entries(colors)) {
        if (typeof color === 'string') variables[`--notebook-${key}`] = color;
    }
    variables['--notebook-ink'] = 'ink' in palette ? palette.ink : '#f3f4f6';
    variables['--notebook-secondary'] = 'secondary' in palette ? palette.secondary : '#9ca3af';
    const tabs = 'tabs' in palette ? palette.tabs : ['#6fa0e6', '#b3ce68', '#ef7d6a', '#ffd76e', '#f5a04c'];
    tabs.forEach((color, i) => { variables[`--notebook-tab-${i}`] = color; });
    return variables;
}
