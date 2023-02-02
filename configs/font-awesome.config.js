// Font Awesome configuration: https://github.com/nuxt-community/fontawesome-module

function convertToFaList(icons) {
  return icons.map(icon => `fa${icon}`);
}

const solid = [
  'AngleDown',
  'Book',
  'Bug',
  'Bullseye',
  'Calendar',
  'CalendarCheck',
  'CaretDown',
  'CaretLeft',
  'CaretRight',
  'Check',
  'CheckSquare',
  'Circle',
  'Cogs',
  'Desktop',
  'Donate',
  'DotCircle',
  'EllipsisH',
  'Envelope',
  'Film',
  'Home',
  'Language',
  'MoneyBill',
  'PaperPlane',
  'Phone',
  'Plus',
  'Star',
  'Trophy',
  'Tv',
];

const brands = [
  'Discord',
  'FacebookF',
  'Github',
  'Instagram',
  'Mastodon',
  'Patreon',
  'SnapchatGhost',
  'Twitch',
  'Twitter',
  'Youtube',
];

export function fontAwesomeConfig() {
  return {
    icons: {
      solid: convertToFaList(solid),
      brands: convertToFaList(brands),
    },
  };
}
