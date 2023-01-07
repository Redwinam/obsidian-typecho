import { addIcon } from 'obsidian';

const icons: Record<string, string> = {
  'wp-logo': `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26">
  <g fill="currentColor">
    <path d="m13,26c-9.63167,0 -13,-3.369 -13,-13c0,-9.63133 3.36833,-13 13,-13c9.63167,0 13,3.36867 13,13c0,9.631 -3.36833,13 -13,13zm-7,-17l14,0l0,-2l-14,0l0,2zm0,5l10,0l0,-2l-10,0l0,2zm0,5l12,0l0,-2l-12,0l0,2z"/>
    </g>
</svg>`
};

export const addIcons = (): void => {
  Object.keys(icons).forEach((key) => {
    addIcon(key, icons[key]);
  });
};


