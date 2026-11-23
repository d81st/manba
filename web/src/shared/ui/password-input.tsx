"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { getMessages } from "@/shared/i18n";
import { Input, type InputProps } from "@/shared/ui/input";

// A password box with a button that shows what was typed: easier on a phone
// than typing blind. The button says what it does in words for screen readers.
export function PasswordInput(props: Omit<InputProps, "type">) {
  const [shown, setShown] = useState(false);
  const label = getMessages().forms.showPassword;
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className="pe-12" />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={label}
        aria-pressed={shown}
        title={label}
        className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center rounded-e-md text-muted-foreground hover:text-foreground"
      >
        {shown ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}
