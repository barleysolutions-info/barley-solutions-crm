type AresResponse = {
  obchodniJmeno?: string;
  ico?: string;
  dic?: string;
  pravniForma?: string;
  sidlo?: {
    textovaAdresa?: string;
    nazevObce?: string;
    psc?: number | string;
  };
};

export type AresCompany = {
  name: string;
  ico: string;
  dic: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  legalForm: string | null;
};

export async function fetchAres(ico: string): Promise<AresCompany> {
  const clean = ico.replace(/\D/g, "").padStart(8, "0");
  const res = await fetch(
    `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${clean}`,
    {
      headers: { accept: "application/json" },
    },
  );

  if (res.status === 404) {
    throw new Error("Firma s tímto IČO nebyla v rejstříku nalezena.");
  }
  if (!res.ok) {
    throw new Error("Rejstřík ARES je momentálně nedostupný. Zkus to za chvíli.");
  }

  const data = (await res.json()) as AresResponse;
  const zip = data.sidlo?.psc ? String(data.sidlo.psc) : null;

  return {
    name: data.obchodniJmeno ?? "",
    ico: data.ico ?? clean,
    dic: data.dic ?? null,
    address: data.sidlo?.textovaAdresa ?? null,
    city: data.sidlo?.nazevObce ?? null,
    zip: zip ? zip.replace(/(\d{3})(\d{2})/, "$1 $2") : null,
    legalForm: data.pravniForma ?? null,
  };
}

// Groq's OpenAI-compatible chat completions API — replaces the Lovable AI
// gateway this project intentionally does not depend on. Function signature
// is unchanged so summarizeLead/analyzePipeline call-sites don't need to care.
export async function askAi(system: string, prompt: string): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) throw new Error("AI není nakonfigurované.");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Příliš mnoho požadavků na AI. Zkus to za minutu.");
  if (!res.ok) throw new Error("AI se nepodařilo zavolat.");

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}
