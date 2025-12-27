/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Primary color: #1F94DC (blue)
const primaryColorLight = '#1F94DC';
const primaryColorDark = '#5BB5E8';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: primaryColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColorLight,
    primary: primaryColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: primaryColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryColorDark,
    primary: primaryColorDark,
  },
};
