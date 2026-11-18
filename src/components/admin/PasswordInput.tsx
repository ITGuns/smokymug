"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/admin/ui";
import { cn } from "@/lib/cn";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { id: string; error?: boolean };

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
        {shown ? <EyeOff aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} /> : <Eye aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} />}
      </button>
    </div>
  );
}
