# Ollama Cloud Setup Instructions

## 🚀 Ollama Cloud Integration

Vaša aplikacija sada podržava **Ollama Cloud** kao besplatnu alternativu za AI chat funkcionalnost!

## 📋 Konfiguracija

### 1. **Registracija na Ollama Cloud**
- Idite na [Ollama Cloud](https://ollama.ai/cloud)
- Registrirajte se za besplatni account
- Dobijte API ključ

### 2. **Postavite environment varijable**
Kreirajte `.env.local` fajl u root direktoriju:

```bash
# Ollama Cloud Configuration
OLLAMA_API_KEY=f8fefb26fa9a41889ec6ccdd03a51357.NkI_eL-UzP3U-bxKhsOMKS-G
OLLAMA_URL=https://api.ollama.ai/v1/chat
OLLAMA_MODEL=llama3.2

# AI Settings
AI_TEMPERATURE=0.7
AI_MAX_OUTPUT_TOKENS=512
```

### 3. **Dostupni modeli**
- `llama3.2` (preporučeno)
- `llama3.1`
- `mistral`
- `codellama`
- `gemma2`

## 🔄 Prioritet providera

Aplikacija koristi sljedeći prioritet:
1. **Google Gemini** (ako je `GOOGLE_API_KEY` postavljen)
2. **OpenAI** (ako je `OPENAI_API_KEY` postavljen)
3. **Ollama Cloud** (ako je `OLLAMA_API_KEY` postavljen)

## 💰 Troškovi

- **Ollama Cloud**: Besplatni tier dostupan
- **Google Gemini**: Besplatni tier dostupan
- **OpenAI**: Besplatni tier dostupan

## 🧪 Testiranje

1. Postavite `OLLAMA_API_KEY` u `.env.local`
2. Pokrenite aplikaciju: `npm run dev`
3. Idite na chat stranicu
4. Testirajte razgovor s AI

## 🔧 Troubleshooting

### Greška: "No AI provider configured"
- Provjerite da je `OLLAMA_API_KEY` postavljen
- Provjerite da je `.env.local` fajl u root direktoriju

### Greška: "Ollama API error"
- Provjerite da je API ključ valjan
- Provjerite da je model dostupan
- Provjerite internet konekciju

## 📞 Podrška

Za probleme s Ollama Cloud:
- [Ollama Cloud Documentation](https://ollama.ai/docs/cloud)
- [Ollama Community](https://github.com/ollama/ollama)
