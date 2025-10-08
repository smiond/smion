import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Ollama } from 'ollama'
import { saveChatMessage } from '@/lib/database'

// Resolve provider keys: prefer Ollama Cloud as primary provider
const ollamaApiKey = process.env.OLLAMA_API_KEY || 'f8fefb26fa9a41889ec6ccdd03a51357.NkI_eL-UzP3U-bxKhsOMKS-G'
const googleApiKey = process.env.GOOGLE_API_KEY || ''
const resolvedApiKey = process.env.SMION_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''

// Tuning defaults (can be overridden via env)
const DEFAULT_TEMPERATURE = Number.parseFloat(process.env.AI_TEMPERATURE || '0.7')
const MAX_OUTPUT_TOKENS = Number.parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '256', 10)
if (process.env.NODE_ENV !== 'production') {
  const smion = process.env.SMION_OPENAI_API_KEY
  const openaiEnv = process.env.OPENAI_API_KEY
  const googleEnv = process.env.GOOGLE_API_KEY
  const ollamaEnv = process.env.OLLAMA_API_KEY
  const mask = (v?: string) => (v ? `${v.slice(0, 8)}...${v.slice(-4)}` : 'undefined')
  const used = ollamaApiKey
    ? 'OLLAMA_API_KEY'
    : (googleApiKey ? 'GOOGLE_API_KEY' : (resolvedApiKey ? 'OPENAI_API_KEY' : 'NONE'))
  console.log(`[ChatAPI] OLLAMA_API_KEY=${mask(ollamaEnv)} | GOOGLE_API_KEY=${mask(googleEnv)} | SMION_OPENAI_API_KEY=${mask(smion)} | OPENAI_API_KEY=${mask(openaiEnv)} | using=${used}`)
}

const openai = new OpenAI({
  apiKey: resolvedApiKey,
})

// Language detection function
function detectLanguage(message: string): string {
  const croatianWords = [
    // Question words
    'što', 'kako', 'gdje', 'kada', 'zašto', 'tko', 'koji', 'koja', 'koje', 'čime', 's čime',
    // Pronouns
    'moj', 'moja', 'moje', 'tvoj', 'tvoja', 'tvoje', 'naš', 'naša', 'naše', 'vaš', 'vaša', 'vaše',
    // Common words
    'hrvatski', 'hrvatska', 'hrvatsko', 'zagreb', 'molim', 'hvala', 'oprostite', 'dobro', 'loše', 
    'lijepo', 'ružno', 'velik', 'mala', 'mali', 'mala', 'novi', 'nova', 'novo', 'stari', 'stara', 'staro',
    // Hobby and work related
    'hobi', 'hobiji', 'radim', 'radim', 'posao', 'posla', 'poslovi', 'karijera', 'iskustvo', 'iskustva',
    'vještine', 'vještina', 'tehnologije', 'tehnologija', 'projekt', 'projekti', 'projekata',
    'tim', 'tima', 'timova', 'kompanija', 'kompanije', 'tvrtka', 'tvrtke', 'firma', 'firme',
    'obrazovanje', 'škola', 'škole', 'fakultet', 'fakulteta', 'sveučilište', 'sveučilišta',
    'diploma', 'diplome', 'certifikat', 'certifikati', 'certifikata',
    // Verbs
    'radim', 'radiš', 'radi', 'radimo', 'radite', 'rade', 'raditi', 'raditi',
    'volim', 'voliš', 'voli', 'volimo', 'volite', 'vole', 'voljeti', 'voljeti',
    'znam', 'znaš', 'zna', 'znamo', 'znate', 'znaju', 'znati', 'znati',
    'mogu', 'možeš', 'može', 'možemo', 'možete', 'mogu', 'moći', 'moći',
    'imam', 'imaš', 'ima', 'imamo', 'imate', 'imaju', 'imati', 'imati',
    // Common phrases
    'što radim', 'kako radim', 'gdje radim', 'kada radim', 'zašto radim',
    'što volim', 'kako volim', 'gdje volim', 'kada volim', 'zašto volim',
    'što znam', 'kako znam', 'gdje znam', 'kada znam', 'zašto znam',
    'što mogu', 'kako mogu', 'gdje mogu', 'kada mogu', 'zašto mogu',
    'što imam', 'kako imam', 'gdje imam', 'kada imam', 'zašto imam'
  ]
  
  const germanWords = [
    'was', 'wie', 'wo', 'wann', 'warum', 'wer', 'welcher', 'welche', 'welches', 'womit', 'mit was',
    'mein', 'meine', 'mein', 'dein', 'deine', 'dein', 'unser', 'unsere', 'unser', 'euer', 'eure', 'euer',
    'deutsch', 'deutsche', 'deutsches', 'berlin', 'deutschland', 'bitte', 'danke', 'entschuldigung', 
    'gut', 'schlecht', 'schön', 'hässlich', 'groß', 'klein', 'neu', 'alt',
    'hobby', 'hobbys', 'arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten',
    'job', 'jobs', 'karriere', 'erfahrung', 'erfahrungen', 'fähigkeiten', 'fähigkeit',
    'technologien', 'technologie', 'projekt', 'projekte', 'team', 'teams', 'unternehmen', 'firma', 'firmen'
  ]
  
  const lowerMessage = message.toLowerCase()
  
  // Count Croatian words
  const croatianCount = croatianWords.filter(word => lowerMessage.includes(word)).length
  
  // Count German words  
  const germanCount = germanWords.filter(word => lowerMessage.includes(word)).length
  
  // Check for Croatian-specific characters
  const croatianChars = ['č', 'ć', 'đ', 'š', 'ž']
  const hasCroatianChars = croatianChars.some(char => lowerMessage.includes(char))
  
  // Check for German-specific characters
  const germanChars = ['ä', 'ö', 'ü', 'ß']
  const hasGermanChars = germanChars.some(char => lowerMessage.includes(char))
  
  // Enhanced detection logic
  if (hasCroatianChars || croatianCount > 0) {
    return 'hr'
  } else if (hasGermanChars || germanCount > 0) {
    return 'de'
  } else {
    return 'en'
  }
}

// Ollama Cloud API function using Ollama client with fail-fast timeout
async function callOllamaCloud(prompt: string, language: string, timeoutMs: number = 40000) {
  const baseURL = 'https://api.ollama.ai/v1' // Use correct Ollama Cloud endpoint
  const model = 'llama3.1' // Use available model

  const client = new OpenAI({
    apiKey: ollamaApiKey,
    baseURL,
  })

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${language === 'hr' ? 'Croatian' : language === 'de' ? 'German' : 'English'}.`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
    }, { signal: controller.signal as any }) as any
    const text = completion.choices?.[0]?.message?.content
    return text || "I'm sorry, I couldn't generate a response."
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('OLLAMA_TIMEOUT')
    throw e
  } finally {
    clearTimeout(id)
  }
}

// Quick Ollama Cloud healthcheck - verifies URL/key/model accessibility fast
async function ollamaHealthcheck(timeoutMs: number = 8000): Promise<{ ok: boolean; reason?: string }> {
  try {
    const ollamaCloudClient = new OpenAI({
      baseURL: 'https://api.ollama.ai/v1', // Use correct Ollama Cloud endpoint
      apiKey: ollamaApiKey,
    })

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    
    // Try a simple chat completion to verify API works
    const testResponse = await Promise.race([
      ollamaCloudClient.chat.completions.create({
        model: 'llama3.1',
        messages: [{ role: 'user', content: 'hello' }],
        temperature: 0.1,
        max_tokens: 5,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ollama healthcheck timed out')), timeoutMs))
    ]) as OpenAI.Chat.Completions.ChatCompletion

    clearTimeout(id)
    
    if (testResponse.choices && testResponse.choices.length > 0) {
      return { ok: true }
    } else {
      return { ok: false, reason: 'No response choices returned' }
    }
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'fetch_failed' }
  }
}

// Quick chat probe to ensure chat endpoint responds
async function ollamaChatProbe(timeoutMs: number = 6000): Promise<boolean> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'https://api.ollama.ai'
    const model = 'llama3.1' // Force use of available model
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ollamaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        options: { temperature: 0, num_predict: 32 }
      }),
      signal: controller.signal,
    })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}

// CV data for RAG system - Updated with Smion's real information
const cvData = {
  personal: {
    name: "Smion Đurđević",
    title: "Engineering Manager",
    email: "smionaz@gmail.com",
    phone: "+385 91 614 39 89",
    location: "Zagreb, Croatia",
    birthplace: "Zagreb",
    website: "www.smion.com.hr",
    date_of_birth: "1972-09-01",
    summary: "Experienced Engineering Manager with expertise in team leadership, software development, and cloud technologies. Currently managing engineering teams at ASEE Solutions with a strong background in C# .NET, Azure, and agile methodologies.",
    background_note: "Grew up in Trešnjevka (Zagreb district); in free time builds various apps to overcome daily challenges.",
    hobbies: "Motors and fast riding (responsibly) — until the boys in blue say hi."
  },
  experience: [
    {
      title: "Engineering Manager",
      company: "ASEE Solutions",
      period: "2024 - Present",
      description: "Leading engineering teams, managing software development projects, implementing agile methodologies, and driving technical excellence across multiple products."
    },
    {
      title: "Tech Lead", 
      company: "NETS CEE",
      period: "2021 - 2024",
      description: "Led technical architecture decisions, mentored development teams, and implemented scalable solutions using modern technologies."
    },
    {
      title: "Team Lead",
      company: "ZUBAK GRUPA", 
      period: "2015 - 2020",
      description: "Managed development teams, coordinated project delivery, and implemented best practices in software development and team collaboration."
    }
  ,
    {
      title: "Developer",
      company: "Autus ulaganja, Zagreb",
      period: "Travanj 2010 – Rujan 2010",
      description: "Razvoj web/portal/internih aplikacija. Implementacija i održavanje sustava (AD, Exchange, backup, ISA, SharePoint) kao vanjski suradnik. Sudjelovanje u nabavi IT opreme i ugovorima za software."
    },
    {
      title: "Programer",
      company: "Sobra d.o.o., Zagreb",
      period: "Siječanj 2010 – Rujan 2010",
      description: "Windows Forms softver (C# .NET, SQL) za komunikaciju s klijentima, import/nadopuna podataka. Postavljanje SBS/Exchange/AD/SharePoint i sigurnosnih razina."
    },
    {
      title: "Administrator",
      company: "Brokerska kuća, Zagreb",
      period: "Rujan 2007 – Prosinac 2010",
      description: "Implementacija SBS 2008 rješenja, osmišljavanje interne mreže, aktivacija Exchange/AD/SharePoint i prilagodba sučelja potrebama tvrtke."
    },
    {
      title: "Voditelj informatičkog odjela",
      company: "Smiondizajn, Zagreb",
      period: "Svibanj 2006 – Rujan 2007",
      description: "Redizajn aplikacija na .NET, SQL stored procedure u C#/VB aplikacijama. Implementacija SharePointa. Održavanje mreža i servera (DC, Exchange, SQL, AD), VPN, DR/backup, nabava HW/SW, dizajn infrastrukture."
    },
    {
      title: "Programer",
      company: "ITcenter – Informatička škola, Zagreb",
      period: "Lipanj 2004 – Svibanj 2006",
      description: "Aplikacija za vrtiće grada Zagreba (C# + MS SQL) u produkciji ~60 vrtića (jelovnici). Izrada .NET web stranica s Flash/animacijama."
    },
    {
      title: "Programer / Predavač",
      company: "ITcenter – Informatička škola, Zagreb",
      period: "Lipanj 2004 – Svibanj 2006",
      description: "Razvoj internih aplikacija; seminari (Photoshop, HTML, Corel). Postavljanje i održavanje mrežne/serverske infrastrukture (Win2K, SBS, 2003, Exchange, SharePoint, ISA, SQL, AD)."
    },
    {
      title: "Održavanje IT sustava",
      company: "Dječji vrtić Srednjaci, Zagreb",
      period: "Travanj 2005 – Svibanj 2006",
      description: "Održavanje mreže, manje web aplikacije, servis opreme, video nadzor, edukacija djelatnika."
    },
    {
      title: "Predavač",
      company: "Poslovna škola Start, Zagreb",
      period: "Svibanj 2002 – Srpanj 2004",
      description: "Predavanja OS (95/98/ME/2000/SBS/XP), održavanje računala, MS Office, Photoshop 6/7, Flash 5/MX/MX2004, Dreamweaver MX; postavljanje učionica i izrada identiteta škole."
    },
    {
      title: "Informatički manager (honor.)",
      company: "Investco vrijednosnice d.o.o., Zagreb",
      period: "Svibanj 2002 – Srpanj 2004",
      description: "Održavanje računala i mreže, implementacija domene/AD/Exchange, sigurnost, web u Flashu, nabava i implementacija interne aplikacije."
    },
    {
      title: "Informatički manager (honor.)",
      company: "Fasek d.o.o., Zagreb",
      period: "Svibanj 2002 – Srpanj 2004",
      description: "Održavanje i servisiranje računala i mreže."
    },
    {
      title: "Servis i održavanje računala",
      company: "Ekologica, Zagreb",
      period: "Svibanj 2002 – Srpanj 2004",
      description: "Održavanje i servis računala."
    },
    {
      title: "Predavač i informatički manager",
      company: "Start d.o.o., Zagreb",
      period: "Listopad 2000 – Travanj 2002",
      description: "Predavanja (OS 95/98/ME/2000/SBS/XP), održavanje/servis, MS Office, Photoshop 6/7, Flash 5/MX/MX2004, Dreamweaver MX, Internet/Ethernet, POP3/SMTP/web serveri."
    },
    {
      title: "Komercijalist (honor.)",
      company: "Brrax d.o.o., Osijek",
      period: "Listopad 2002",
      description: "Prodaja i sastavljanje računala."
    },
    {
      title: "Voditelj kluba",
      company: "Klub Nakladnika",
      period: "Srpanj 1998 – Listopad 2000",
      description: "Organizacija edukacija (MS Office 97), priprema materijala za seminare."
    },
    {
      title: "Voditelj kluba",
      company: "Buba multimedijalni klub, Zagreb",
      period: "Ožujak 1997 – Srpanj 1998",
      description: "Postavljanje i održavanje računala, rad s klijentima, tečajevi osnova OS i MS Office."
    }
  ],
  education: [
    {
      title: "Bachelor of Computer Science",
      institution: "University of Zagreb",
      period: "2010 - 2014"
    }
  ],
  skills: {
    technical: ["C# .NET", "SQL Server", "Azure Cloud", "Docker", "Kubernetes"],
    languages: ["C#", "JavaScript", "SQL", "Python"],
    tools: ["Visual Studio", "Azure DevOps", "SCRUM", "JIRA", "Git"]
  },
  certifications: [
    {
      title: "Microsoft Certified Professional (MCP)",
      issuer: "Microsoft",
      date: "2020"
    },
    {
      title: "Microsoft NAV CRM Certification", 
      issuer: "Microsoft",
      date: "2019"
    },
    {
      title: "Microsoft SharePoint Developer",
      issuer: "Microsoft",
      date: "2018"
    }
  ],
  projects: [
    {
      title: "City of Zagreb Kindergartens – Nutrition Menu System",
      description: "End-to-end solution used across all Zagreb kindergartens to create daily nutrition menus for preschool children (C#/.NET + MS SQL)."
    },
    {
      title: "ORYX Roadside Assistance – Call Center CRM",
      description: "Custom CRM for call center and roadside assistance support: case intake, dispatching, SLA tracking, integrations with provider network and reporting."
    },
    {
      title: "Moontop – Employee Benefits Subsidy Platform",
      description: "Platform enabling companies to utilize state subsidies via employee benefits (Gym, Meals, Medical checkups, etc.); policy rules, allocations and compliance reporting."
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    // Ensure at least one provider is configured
    if (!googleApiKey && !resolvedApiKey && !ollamaApiKey) {
      console.error('No AI API key is configured')
      return NextResponse.json({ 
        error: 'No AI provider configured. Set GOOGLE_API_KEY (Gemini), SMION_OPENAI_API_KEY / OPENAI_API_KEY (OpenAI), or OLLAMA_API_KEY (Ollama Cloud).' 
      }, { status: 500 })
    }

    const { message, language: requestedLanguage, sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Always auto-detect language from message to ensure correct reply language
    const detectedLanguage = detectLanguage(message)
    
    // Debug logging for language detection
    console.log(`[LanguageDetection] message="${message}" | detected="${detectedLanguage}" | requested="${requestedLanguage}"`)

    // Generate session ID if not provided
    const currentSessionId = sessionId || crypto.randomUUID()

    // Save user message to database
    try {
      await saveChatMessage(currentSessionId, message, true, detectedLanguage)
    } catch (dbError) {
      console.error('Database error saving user message:', dbError)
      // Continue without saving to database
    }

    // Helpers: translations and formatting
    const hrMonths: Record<string, { en: string; de: string }> = {
      'Siječanj': { en: 'January', de: 'Januar' },
      'Veljača': { en: 'February', de: 'Februar' },
      'Ožujak': { en: 'March', de: 'März' },
      'Travanj': { en: 'April', de: 'April' },
      'Svibanj': { en: 'May', de: 'Mai' },
      'Lipanj': { en: 'June', de: 'Juni' },
      'Srpanj': { en: 'July', de: 'Juli' },
      'Kolovoz': { en: 'August', de: 'August' },
      'Rujan': { en: 'September', de: 'September' },
      'Listopad': { en: 'October', de: 'Oktober' },
      'Studeni': { en: 'November', de: 'November' },
      'Prosinac': { en: 'December', de: 'Dezember' },
    }

    const translateTitle = (title: string, lng: string) => {
      const map: Record<string, { en: string; de: string }> = {
        // Existing
        'Engineering Manager': { en: 'Engineering Manager', de: 'Engineering Manager' },
        'Tech Lead': { en: 'Tech Lead', de: 'Technischer Leiter' },
        'Team Lead': { en: 'Team Lead', de: 'Teamleiter' },
        'Developer': { en: 'Developer', de: 'Entwickler' },
        'Programer': { en: 'Programmer', de: 'Programmierer' },
        'Programer / Predavač': { en: 'Programmer / Lecturer', de: 'Programmierer / Dozent' },
        'Administrator': { en: 'Administrator', de: 'Administrator' },
        'Voditelj informatičkog odjela': { en: 'Head of IT Department', de: 'Leiter der IT-Abteilung' },
        'Održavanje IT sustava': { en: 'IT Systems Maintenance', de: 'Wartung von IT-Systemen' },
        'Predavač': { en: 'Lecturer', de: 'Dozent' },
        'Informatički manager (honor.)': { en: 'IT Manager (part-time)', de: 'IT-Manager (honorar)' },
        'Servis i održavanje računala': { en: 'PC Service and Maintenance', de: 'PC-Service und Wartung' },
        'Predavač i informatički manager': { en: 'Lecturer and IT Manager', de: 'Dozent und IT-Manager' },
        'Komercijalist (honor.)': { en: 'Sales Associate (part-time)', de: 'Vertriebsmitarbeiter (honorar)' },
        'Voditelj kluba': { en: 'Club Manager', de: 'Clubleiter' },

        // Additional common variants
        'Software Engineer': { en: 'Software Engineer', de: 'Softwareentwickler' },
        'Senior Software Engineer': { en: 'Senior Software Engineer', de: 'Senior Softwareentwickler' },
        'Software Developer': { en: 'Software Developer', de: 'Softwareentwickler' },
        'Senior Developer': { en: 'Senior Developer', de: 'Senior Entwickler' },
        'Full Stack Developer': { en: 'Full Stack Developer', de: 'Full-Stack-Entwickler' },
        'Backend Developer': { en: 'Backend Developer', de: 'Backend-Entwickler' },
        'Frontend Developer': { en: 'Frontend Developer', de: 'Frontend-Entwickler' },
        'Solution Architect': { en: 'Solution Architect', de: 'Solution Architekt' },
        'Systems Engineer': { en: 'Systems Engineer', de: 'Systemingenieur' },
        'Systems Administrator': { en: 'Systems Administrator', de: 'Systemadministrator' },
        'Database Administrator': { en: 'Database Administrator', de: 'Datenbankadministrator' },
        'DevOps Engineer': { en: 'DevOps Engineer', de: 'DevOps-Ingenieur' },
        'IT Manager': { en: 'IT Manager', de: 'IT-Manager' },
        'Head of IT': { en: 'Head of IT', de: 'Leiter IT' },
        'Project Manager': { en: 'Project Manager', de: 'Projektmanager' },
        'Business Analyst': { en: 'Business Analyst', de: 'Business-Analyst' },
        'Consultant': { en: 'Consultant', de: 'Berater' },
        'Intern': { en: 'Intern', de: 'Praktikant' },

        // Requested additions
        'Security Engineer': { en: 'Security Engineer', de: 'Security Engineer' },
        'SDLC': { en: 'SDLC', de: 'SDLC' },
        'GDPR': { en: 'GDPR', de: 'DSGVO' },

        // Croatian variants that may appear
        'Informatički manager': { en: 'IT Manager', de: 'IT-Manager' },
        'Informatički menadžer': { en: 'IT Manager', de: 'IT-Manager' },
        'Voditelj IT odjela': { en: 'Head of IT Department', de: 'Leiter der IT-Abteilung' },
        'Administrator sustava': { en: 'Systems Administrator', de: 'Systemadministrator' },
        'Voditelj informatike': { en: 'Head of IT', de: 'Leiter IT' },
      }
      const entry = map[title]
      if (!entry) return title
      if (lng === 'de') return entry.de
      if (lng === 'en' || lng === 'en-US' || lng === 'en-GB') return entry.en
      return title
    }

    const translatePeriod = (period: string, lng: string) => {
      if (lng !== 'de' && lng !== 'en' && lng !== 'en-US' && lng !== 'en-GB') return period
      let result = period
      for (const [hr, vals] of Object.entries(hrMonths)) {
        const re = new RegExp(hr, 'g')
        result = result.replace(re, lng === 'de' ? vals.de : vals.en)
      }
      // Common words
      result = result.replace(/–/g, '-')
      return result
    }

    const shorten = (text: string, maxLen = 200) => {
      if (!text) return ''
      if (text.length <= maxLen) return text
      return text.slice(0, maxLen - 1).trimEnd() + '…'
    }

    // Create context from CV data (translated/shortened for chat)
    const context = `
Personal Information:
- Name: ${cvData.personal.name}
- Title: ${cvData.personal.title}
- Email: ${cvData.personal.email}
- Phone: ${cvData.personal.phone}
- Location: ${cvData.personal.location}
- Birthplace: ${cvData.personal.birthplace}
- Date of Birth: ${cvData.personal.date_of_birth}
- Summary: ${cvData.personal.summary}
 - Personal: ${cvData.personal.background_note}
 - Hobbies: ${cvData.personal.hobbies}

Professional Experience:
${cvData.experience.map(exp => {
    const t = translateTitle(exp.title, detectedLanguage)
    const p = translatePeriod(exp.period, detectedLanguage)
  const d = shorten(exp.description)
  return `\n- ${t} at ${exp.company} (${p})\n  ${d}\n`
}).join('')}

Education:
${cvData.education.map(edu => `
- ${edu.title} from ${edu.institution} (${edu.period})
`).join('')}

Skills:
- Technical: ${cvData.skills.technical.join(', ')}
- Programming Languages: ${cvData.skills.languages.join(', ')}
- Tools & Technologies: ${cvData.skills.tools.join(', ')}

Certifications:
${cvData.certifications.map(cert => `
- ${cert.title} from ${cert.issuer} (${cert.date})
`).join('')}

 Major Projects:
 ${cvData.projects.map(p => `
 - ${p.title}: ${p.description}
 `).join('')}
    `

    let response = ""
    const startedAtMs = Date.now()
    
    // Try providers in order: Ollama Cloud -> Google Gemini -> OpenAI
    if (ollamaApiKey) {
      // quick healthcheck to avoid hanging on misconfig
      const hc = await ollamaHealthcheck(8000)
      if (!hc.ok || !(await ollamaChatProbe(6000))) {
        console.error('Ollama healthcheck failed:', hc.reason)
        return NextResponse.json({
          response: detectedLanguage === 'hr'
            ? 'AI servis trenutno nije dostupan (Ollama Cloud). Provjerite postavke i pokušajte kasnije.'
            : detectedLanguage === 'de'
            ? 'Der KI-Dienst ist derzeit nicht verfügbar (Ollama Cloud). Bitte später erneut versuchen.'
            : 'AI service is not available right now (Ollama Cloud). Please try again later.',
          sessionId: currentSessionId,
        })
      }
      // Ollama Cloud as primary option
      try {
        response = await callOllamaCloud(`Context about Smion Đurđević:\n${context}\n\nQuestion: ${message}`, detectedLanguage)
      } catch (ollamaErr) {
        console.error('Ollama failed:', ollamaErr)
        // If Ollama timed out, return a friendly message quickly
        if ((ollamaErr as Error)?.message === 'OLLAMA_TIMEOUT') {
          return NextResponse.json({
            response: detectedLanguage === 'hr'
              ? 'Trenutno je sporo spajanje na AI servis. Pokušajte ponovno za par sekundi.'
              : detectedLanguage === 'de'
              ? 'Die Verbindung zum KI-Dienst ist momentan langsam. Bitte versuchen Sie es in ein paar Sekunden erneut.'
              : 'AI service is responding slowly right now. Please try again in a few seconds.',
            sessionId: currentSessionId,
          })
        }
        // Try Google Gemini as fallback
        if (googleApiKey) {
          try {
            const genAI = new GoogleGenerativeAI(googleApiKey)
            const prompt = `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${detectedLanguage === 'hr' ? 'Croatian' : detectedLanguage === 'de' ? 'German' : 'English' }.

Context:\n${context}\n\nQuestion: ${message}`

            const candidateModels = ['gemini-2.5-flash', 'gemini-1.0-pro']
            let lastError: unknown = null
            for (const modelId of candidateModels) {
              try {
                const model = genAI.getGenerativeModel({ model: modelId })
                const geminiResult = await model.generateContent({
                  contents: [{ role: 'user', parts: [{ text: prompt }]}],
                  generationConfig: {
                    temperature: DEFAULT_TEMPERATURE,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                  },
                })
                response = geminiResult.response.text()
                break
              } catch (err) {
                lastError = err
                continue
              }
            }
            if (!response) {
              console.error('Gemini fallback failed:', lastError)
              // Try OpenAI as final fallback
              if (resolvedApiKey) {
                try {
                  const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                      {
                        role: "system",
                        content: `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${detectedLanguage === 'hr' ? 'Croatian' : detectedLanguage === 'de' ? 'German' : 'English'}.`
                      },
                      {
                        role: "user",
                        content: `Context about Smion Đurđević:\n${context}\n\nQuestion: ${message}`
                      }
                    ],
                    max_tokens: MAX_OUTPUT_TOKENS,
                    temperature: DEFAULT_TEMPERATURE,
                  })
                  response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
                } catch (openaiErr) {
                  console.error('OpenAI final fallback failed:', openaiErr)
                  response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
                }
              } else {
                response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
              }
            }
          } catch (geminiErr) {
            console.error('Google Gemini fallback failed:', geminiErr)
            response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
          }
        } else if (resolvedApiKey) {
          // Try OpenAI as fallback
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${detectedLanguage === 'hr' ? 'Croatian' : detectedLanguage === 'de' ? 'German' : 'English'}.`
                },
                {
                  role: "user",
                  content: `Context about Smion Đurđević:\n${context}\n\nQuestion: ${message}`
                }
              ],
              max_tokens: MAX_OUTPUT_TOKENS,
              temperature: DEFAULT_TEMPERATURE,
            })
            response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
          } catch (openaiErr) {
            console.error('OpenAI fallback failed:', openaiErr)
            response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
          }
        } else {
          response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
        }
      }
    } else if (googleApiKey) {
      // Google Gemini as fallback
      const genAI = new GoogleGenerativeAI(googleApiKey)
      const prompt = `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${detectedLanguage === 'hr' ? 'Croatian' : detectedLanguage === 'de' ? 'German' : 'English' }.

Context:\n${context}\n\nQuestion: ${message}`

      const candidateModels = ['gemini-2.5-flash', 'gemini-1.0-pro']
      let lastError: unknown = null
      for (const modelId of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelId })
          const geminiResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }]}],
            generationConfig: {
              temperature: DEFAULT_TEMPERATURE,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
            },
          })
          response = geminiResult.response.text()
          break
        } catch (err) {
          lastError = err
          continue
        }
      }
      if (!response) {
        console.error('Gemini generation failed with all models:', lastError)
        // Try OpenAI as fallback
        if (resolvedApiKey) {
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${detectedLanguage === 'hr' ? 'Croatian' : detectedLanguage === 'de' ? 'German' : 'English'}.`
                },
                {
                  role: "user",
                  content: `Context about Smion Đurđević:\n${context}\n\nQuestion: ${message}`
                }
              ],
              max_tokens: MAX_OUTPUT_TOKENS,
              temperature: DEFAULT_TEMPERATURE,
            })
            response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
          } catch (fallbackErr) {
            console.error('OpenAI fallback failed after Gemini error:', fallbackErr)
            response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
          }
        } else {
          response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
        }
      }
    } else if (resolvedApiKey) {
      // OpenAI as fallback
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${detectedLanguage === 'hr' ? 'Croatian' : detectedLanguage === 'de' ? 'German' : 'English'}.`
            },
            {
              role: "user", 
              content: `Context about Smion Đurđević:\n${context}\n\nQuestion: ${message}`
            }
          ],
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: DEFAULT_TEMPERATURE,
        })
        response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
      } catch (openaiErr) {
        console.error('OpenAI failed:', openaiErr)
        response = 'Nažalost, trenutno ne mogu generirati odgovor (AI provider error). Pokušajte ponovno za par trenutaka.'
      }
    }

    const generationMs = Date.now() - startedAtMs
    const provider = ollamaApiKey ? 'Ollama' : (googleApiKey ? 'Gemini' : 'OpenAI')
    console.log(`[ChatAPI] provider=${provider} temperature=${DEFAULT_TEMPERATURE} maxTokens=${MAX_OUTPUT_TOKENS} timeMs=${generationMs} chars=${response.length}`)

    // Save AI response to database
    try {
      await saveChatMessage(currentSessionId, response, false, detectedLanguage)
    } catch (dbError) {
      console.error('Database error saving AI response:', dbError)
      // Continue without saving to database
    }

    return NextResponse.json({ 
      response, 
      sessionId: currentSessionId 
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    // Return friendly message to avoid breaking client UX
    return NextResponse.json({
      response: 'Oprostite, došlo je do pogreške pri obradi zahtjeva. Pokušajte ponovno uskoro.',
    })
  }
}

