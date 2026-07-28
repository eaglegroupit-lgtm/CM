"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertCircle,
  Boxes,
  Eye,
  EyeOff,
  FileText,
  Gem,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { login } from "./actions";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: FileText, label: "GST-ready invoicing for every sale" },
  { icon: Boxes, label: "Slab, tile & quartz inventory by lot" },
  { icon: ShieldCheck, label: "Role-based access for your whole team" },
];

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <LoginForm />
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[oklch(0.16_0_0)] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="kmg-blob-1 absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-amber-400/25 via-amber-200/10 to-transparent blur-3xl" />
        <div className="kmg-blob-2 absolute -right-24 -bottom-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-slate-400/20 via-sky-300/10 to-transparent blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, white 0px, white 1px, transparent 1px, transparent 90px)",
          }}
        />
      </div>

      <div className="animate-in fade-in slide-in-from-left-4 relative z-10 duration-700">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-400/15 ring-1 ring-amber-300/30">
            <Gem className="size-4.5 text-amber-300" />
          </div>
          <span className="text-sm font-medium tracking-wide text-white/70">
            KOVAI MARBLES &amp; GRANITES
          </span>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-left-4 relative z-10 max-w-md duration-700 delay-150 [animation-fill-mode:both]">
        <h1 className="text-4xl font-semibold tracking-tight text-white text-balance">
          Marbles, granites, tiles &amp; quartz — run entirely from one place.
        </h1>
        <p className="mt-4 text-white/55">
          GST invoicing, lot-wise stock, and complete double-entry accounts for the business.
        </p>

        <ul className="mt-9 grid gap-3.5 text-sm text-white/75">
          {FEATURES.map((f, i) => (
            <li
              key={f.label}
              className="animate-in fade-in slide-in-from-left-2 flex items-center gap-3 [animation-fill-mode:both]"
              style={{ animationDelay: `${350 + i * 120}ms`, animationDuration: "600ms" }}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10">
                <f.icon className="size-3.5 text-amber-300" />
              </span>
              {f.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-in fade-in relative z-10 text-xs text-white/35 duration-700 delay-500 [animation-fill-mode:both]">
        360/2, Thadagam Main Rd, near J M Hospital, Lakshmi Nagar, Edayarpalayam, Coimbatore — +91 99444 02142
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: FormValues) {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    startTransition(async () => {
      const result = await login(formData);
      if (result.error) {
        setServerError(result.error);
        setErrorKey((k) => k + 1);
        return;
      }
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-sm duration-700 [animation-fill-mode:both]">
      <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
        <div className="bg-primary/10 ring-primary/15 flex size-10 items-center justify-center rounded-xl ring-1">
          <Gem className="text-primary size-5" />
        </div>
        <span className="font-semibold">Kovai Marbles &amp; Granites</span>
      </div>

      <div className="mb-7 text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Sign in to the accounts &amp; inventory platform
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <Mail />
                    </InputGroupAddon>
                    <InputGroupInput
                      type="email"
                      autoComplete="email"
                      placeholder="you@kovaimarbles.com"
                      {...field}
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <Lock />
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <div
              key={errorKey}
              className="kmg-shake border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <AlertCircle className="size-4 shrink-0" />
              {serverError}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="group relative w-full overflow-hidden">
            {!isPending && (
              <span
                aria-hidden
                className="kmg-shimmer-sweep pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? "Signing in..." : "Sign in"}
            </span>
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground mt-6 text-center text-xs lg:text-left">
        Access is provisioned by your administrator. Contact them for a password reset.
      </p>
    </div>
  );
}
