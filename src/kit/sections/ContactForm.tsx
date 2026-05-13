"use client";

/**
 * ContactForm
 * Generalised from Personal-Portfolio/src/sections/Contact.jsx.
 *
 * Plain contact form scaffolded with name/email/message fields. The submit
 * handler is plumbed via the `onSubmit` prop so you can post to any backend
 * (Web3Forms, your own API, Resend, etc.).
 */
import { useState, type FormEvent } from "react";
import { Alert } from "@/kit/effects/Alert";

export type ContactFormValues = { name: string; email: string; message: string };

export type ContactFormProps = {
  onSubmit: (values: ContactFormValues) => Promise<void>;
  heading?: string;
  intro?: React.ReactNode;
  submitLabel?: string;
  className?: string;
};

export function ContactForm({
  onSubmit,
  heading = "Let's Talk",
  intro,
  submitLabel = "Send",
  className,
}: ContactFormProps) {
  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean; type: "success" | "danger"; text: string }>({
    open: false,
    type: "success",
    text: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
      setValues({ name: "", email: "", message: "" });
      setAlert({ open: true, type: "success", text: "Your message has been sent!" });
    } catch (err) {
      console.error(err);
      setAlert({ open: true, type: "danger", text: "Something went wrong!" });
    } finally {
      setLoading(false);
      setTimeout(() => setAlert((a) => ({ ...a, open: false })), 5000);
    }
  };

  return (
    <section className={`relative flex items-center px-6 py-20 ${className ?? ""}`}>
      <Alert {...alert} />
      <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-white/10 bg-blaze-surface p-5">
        <div className="mb-10 flex w-full flex-col items-start gap-5">
          <h2 className="text-3xl font-bold">{heading}</h2>
          {intro ? <div className="text-blaze-muted">{intro}</div> : null}
        </div>
        <form className="w-full" onSubmit={handleSubmit}>
          {(["name", "email", "message"] as const).map((field) => (
            <div key={field} className="mb-5">
              <label htmlFor={field} className="mb-1 block text-sm uppercase tracking-wide">
                {field}
              </label>
              {field === "message" ? (
                <textarea
                  id="message"
                  rows={4}
                  className="w-full rounded-md border border-blaze-line bg-blaze-bg px-3 py-2 outline-none focus:ring-2 focus:ring-blaze-accent"
                  value={values.message}
                  onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                  required
                />
              ) : (
                <input
                  id={field}
                  type={field}
                  className="w-full rounded-md border border-blaze-line bg-blaze-bg px-3 py-2 outline-none focus:ring-2 focus:ring-blaze-accent"
                  value={values[field]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [field]: e.target.value }))
                  }
                  required
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blaze-accent2 px-1 py-3 text-center font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending..." : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
