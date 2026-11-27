
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  const { apiKey, text } = req.body || {};

  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({
      error: "Anthropic API key is required.",
    });
  }

  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 5000
  ) {
    return res.status(400).json({
      error: "Valid text is required.",
    });
  }

  try {
    const response = await fetch(
      "https://api.anthropic.com/v1/messages/count_tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-5-5",
          messages: [
            {
              role: "user",
              content: text,
            },
          ],
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errors = {
        400: "Invalid API request.",
        401: "Invalid Anthropic API key.",
        403: "API access denied.",
        404: "Claude model is unavailable.",
        429: "Rate limit reached. Try again later.",
        500: "Anthropic server error.",
        529: "Anthropic API is overloaded.",
      };

      return res.status(response.status).json({
        error:
          errors[response.status] ||
          "Token counting request failed.",
      });
    }

    const data = await response.json();

    if (!Number.isInteger(data.input_tokens)) {
      return res.status(502).json({
        error: "Invalid response from Anthropic.",
      });
    }

    return res.status(200).json({
      input_tokens: data.input_tokens,
    });

  } catch {
    return res.status(502).json({
      error: "Unable to connect to Anthropic API.",
    });
  }
}
