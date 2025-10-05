import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { saveChatMessage } from '@/lib/database'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// CV data for RAG system - Updated with Smion's real information
const cvData = {
  personal: {
    name: "Smion Đurđević",
    title: "Engineering Manager",
    email: "smionaz@gmail.com",
    phone: "+385 91 614 39 89",
    location: "Zagreb, Croatia",
    website: "www.smion.com.hr",
    date_of_birth: "1972-09-01",
    summary: "Experienced Engineering Manager with expertise in team leadership, software development, and cloud technologies. Currently managing engineering teams at ASEE Solutions with a strong background in C# .NET, Azure, and agile methodologies."
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
  ]
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured')
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' 
      }, { status: 500 })
    }

    const { message, language = 'en', sessionId } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Generate session ID if not provided
    const currentSessionId = sessionId || crypto.randomUUID()

    // Save user message to database
    try {
      await saveChatMessage(currentSessionId, message, true, language)
    } catch (dbError) {
      console.error('Database error saving user message:', dbError)
      // Continue without saving to database
    }

    // Create context from CV data
    const context = `
Personal Information:
- Name: ${cvData.personal.name}
- Title: ${cvData.personal.title}
- Email: ${cvData.personal.email}
- Phone: ${cvData.personal.phone}
- Location: ${cvData.personal.location}
- Date of Birth: ${cvData.personal.date_of_birth}
- Summary: ${cvData.personal.summary}

Professional Experience:
${cvData.experience.map(exp => `
- ${exp.title} at ${exp.company} (${exp.period})
  ${exp.description}
`).join('')}

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
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions about Smion Đurđević's CV and professional experience. Use the provided context to answer questions accurately and professionally. If asked about something not in the context, politely say you don't have that information. Keep responses concise and relevant. Respond in ${language === 'hr' ? 'Croatian' : language === 'de' ? 'German' : 'English'}.`
        },
        {
          role: "user", 
          content: `Context about Smion Đurđević:\n${context}\n\nQuestion: ${message}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    // Save AI response to database
    try {
      await saveChatMessage(currentSessionId, response, false, language)
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
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

