"use client";

// The /contact form: the only client island on the contact page.

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    const response = await fetch("/api/relay/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        message,
        currentUrl: window.location.href,
      }),
    });

    if (response.ok) {
      setName("");
      setEmail("");
      setMessage("");
      setStatus("sent");
      return;
    }

    setStatus("error");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-3xl border border-border bg-card/80 p-5 shadow-sm"
    >
      <Input
        required
        minLength={2}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
      />
      <Input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
      />
      <Textarea
        required
        minLength={10}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What should we know?"
      />
      {status === "sent" ? (
        <p className="text-sm text-primary">Thanks, your note was sent.</p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-destructive">
          We could not send that. Try again in a moment.
        </p>
      ) : null}
      <Button
        type="submit"
        className="justify-self-start rounded-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
