import { KeyRoundIcon, PaletteIcon, ShieldCheckIcon, UserRoundIcon } from 'lucide-react';

export const settingsSections = [
{ id: 'profile', label: 'Profile', icon: UserRoundIcon },
{ id: 'appearance', label: 'Appearance', icon: PaletteIcon },
{ id: 'privacy', label: 'Privacy & data', icon: ShieldCheckIcon },
{ id: 'account', label: 'Account', icon: KeyRoundIcon }] as
const;

export type SettingsSectionId = (typeof settingsSections)[number]['id'];