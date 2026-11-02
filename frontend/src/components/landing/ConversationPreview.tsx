import React from 'react';
import { ArrowUpIcon, MicIcon } from 'lucide-react';
import { LogoMark } from '../common/Logo';

/** Static illustration of the workspace. Not real user data or model output. */
export function ConversationPreview() {
  return (
    <figure className="w-full">
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-lift" aria-hidden="true">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <LogoMark className="h-7 w-7" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">Getting ready for the presentation</p>
            <p className="text-[11px] text-muted">Today</p>
          </div>
        </div>
        <div className="space-y-6 bg-canvas/60 px-5 py-6">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-[14px] leading-relaxed text-on-accent">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium opacity-80">
                <MicIcon className="h-3 w-3" /> Voice message · 0:18 · transcript
              </span>
              I know the material, but my chest gets tight every time I picture the room.
            </div>
          </div>
          <div className="flex gap-3">
            <LogoMark className="mt-0.5 h-6 w-6" />
            <p className="max-w-[88%] text-[14px] leading-[1.7] text-ink">
              That tightness makes sense — tomorrow matters to you. It sounds like the worry is less about the material and more about being seen while you share it. Want to walk through the opening together?
            </p>
          </div>
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-1.5 pl-4">
            <span className="flex-1 text-[14px] text-muted">Share what's on your mind…</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-ink"><MicIcon className="h-4 w-4" /></span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-on-accent"><ArrowUpIcon className="h-4 w-4" /></span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Illustrative preview of the EmoSense workspace</figcaption>
    </figure>);

}