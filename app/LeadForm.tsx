"use client";

import { startTransition, useState, useTransition } from "react";

import type { LeadApiResponse, LeadFormPayload } from "@/lib/types";

const initialState: LeadFormPayload = {
  telegram_or_email: "",
  project_summary: "",
  consent: false,
  website: "",
};

export default function LeadForm() {
  const [form, setForm] = useState<LeadFormPayload>(initialState);
  const [response, setResponse] = useState<LeadApiResponse | null>(null);
  const [isPending, startRequest] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResponse(null);

    startRequest(async () => {
      const result = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await result.json()) as LeadApiResponse;

      startTransition(() => {
        setResponse(payload);
        if (payload.status === "success") {
          setForm(initialState);
        }
      });
    });
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <label>
        <span>Telegram или email</span>
        <input
          value={form.telegram_or_email}
          onChange={(event) => setForm((current) => ({ ...current, telegram_or_email: event.target.value }))}
          name="telegram_or_email"
          placeholder="@username или почта"
          required
        />
      </label>

      <label className="summary-field">
        <span>Задача</span>
        <textarea
          value={form.project_summary}
          onChange={(event) => setForm((current) => ({ ...current, project_summary: event.target.value }))}
          name="project_summary"
          placeholder="Коротко: что происходит сейчас и какой результат нужен"
          rows={7}
          required
        />
      </label>

      <div className="hp-field" aria-hidden="true">
        <label>
          <span>Website</span>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
            name="website"
          />
        </label>
      </div>

      <label className="consent-row">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
          name="consent"
          required
        />
        <span>Согласен на обработку контакта и описания задачи для ответа по проекту.</span>
      </label>

      <div className="form-actions">
        <button className="button button-dark" type="submit" disabled={isPending}>
          {isPending ? "Отправляю..." : "Отправить заявку →"}
        </button>
      </div>

      {response ? <p className={`form-response is-${response.status}`}>{response.message}</p> : null}
    </form>
  );
}
