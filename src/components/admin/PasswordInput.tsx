"use client";

import { useState } from "react";
import { Input } from "@/components/admin/ui";
import { cn } from "@/lib/cn";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { id: string; error?: boolean };

const EYE = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";
const EYE_OFF =
  "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22";

/** Admin password field with a show/hide button (audit F7). The button sits inside the
 *  input's right padding, so toggling never moves anything; aria-pressed carries the state.
 *  Its name is hidden text, not aria-label, so getByLabel("Password") still finds only the field. */
export function PasswordInput({ className, ...rest }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...rest} type={shown ? "text" : "password"} className={cn("pr-10", className)} />
      <button
        type="button"
        aria-pressed={shown}
        aria-controls={rest.id}
        onClick={() => setShown((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-zinc-500 transition hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
      >
        <span className="sr-only">Show password</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={shown ? EYE_OFF : EYE} />
        </svg>
      </button>
    </div>
  );
}
