import React from 'react';
import { CheckIcon } from 'lucide-react';
import { useTheme, type ThemePreference } from '../../contexts/ThemeContext';
import { cn } from '../../utils/cn';

const options: {value: ThemePreference;label: string;description: string;swatch: [string, string, string];}[] = [
{ value: 'light', label: 'Light', description: 'Warm ivory and soft sage', swatch: ['#FAF9F6', '#FFFFFF', '#476C5B'] },
{ value: 'dark', label: 'Dark', description: 'Deep charcoal, gentle contrast', swatch: ['#171C20', '#293438', '#A8C9B4'] },
{ value: 'system', label: 'System', description: 'Follows your device setting', swatch: ['#FAF9F6', '#171C20', '#8FAF9A'] }];


export function AppearanceSettings() {
  const { preference, setPreference } = useTheme();
  return (
    <section aria-labelledby="appearance-heading">
      <h2 id="appearance-heading" className="text-xl font-semibold tracking-tight text-ink">Appearance</h2>
      <p className="mt-1 text-sm text-muted">Choose how EmoSense looks on this device.</p>
      <div role="radiogroup" aria-labelledby="appearance-heading" className="mt-8 grid gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const selected = preference === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(o.value)}
              className={cn(
                'focus-ring rounded-2xl border p-3 text-left transition-[border-color,background-color] duration-150 ease-out',
                selected ? 'border-accent bg-accent-tint/50' : 'border-line bg-surface hover:border-accent/40'
              )}>
              
              <div className="flex h-20 overflow-hidden rounded-xl border border-line" aria-hidden="true">
                <div className="flex-1 p-2" style={{ background: o.swatch[0] }}>
                  <div className="h-2 w-10 rounded-full" style={{ background: o.swatch[2] }} />
                  <div className="mt-2 h-6 rounded-md" style={{ background: o.swatch[1] }} />
                </div>
                {o.value === 'system' && <div className="w-1/2 p-2" style={{ background: o.swatch[1] }} />}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{o.label}</span>
                {selected && <CheckIcon className="h-4 w-4 text-accent" aria-hidden="true" />}
              </div>
              <p className="mt-0.5 text-xs text-muted">{o.description}</p>
            </button>);

        })}
      </div>
      <p className="mt-6 text-xs text-muted">Animations automatically soften when your device prefers reduced motion.</p>
    </section>);

}