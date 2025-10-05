import pdf from 'pdf-parse'

export interface ParsedCVData {
  text: string
  sections: {
    personal?: string
    experience?: string
    education?: string
    skills?: string
    certifications?: string
  }
}

export async function parsePDF(buffer: Buffer): Promise<ParsedCVData> {
  try {
    const data = await pdf(buffer)
    const text = data.text
    
    // Basic section parsing (you can enhance this based on your CV format)
    const sections = {
      personal: extractSection(text, ['personal', 'contact', 'about']),
      experience: extractSection(text, ['experience', 'work', 'employment']),
      education: extractSection(text, ['education', 'academic', 'qualifications']),
      skills: extractSection(text, ['skills', 'technical', 'competencies']),
      certifications: extractSection(text, ['certifications', 'certificates', 'awards'])
    }
    
    return {
      text,
      sections
    }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Failed to parse PDF')
  }
}

function extractSection(text: string, keywords: string[]): string {
  const lines = text.split('\n')
  let sectionText = ''
  let inSection = false
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim()
    
    // Check if this line starts a section
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      inSection = true
      sectionText += line + '\n'
      continue
    }
    
    // If we're in a section and the line is not empty, add it
    if (inSection && line.trim()) {
      // Check if this might be the start of a new section
      const nextSectionKeywords = ['experience', 'education', 'skills', 'certifications', 'projects', 'achievements']
      if (nextSectionKeywords.some(keyword => lowerLine.includes(keyword) && lowerLine.length < 50)) {
        break
      }
      sectionText += line + '\n'
    } else if (inSection && !line.trim()) {
      // Empty line, continue
      sectionText += '\n'
    }
  }
  
  return sectionText.trim()
}

export function formatCVDataForAI(parsedData: ParsedCVData): string {
  let formattedText = ''
  
  if (parsedData.sections.personal) {
    formattedText += `PERSONAL INFORMATION:\n${parsedData.sections.personal}\n\n`
  }
  
  if (parsedData.sections.experience) {
    formattedText += `PROFESSIONAL EXPERIENCE:\n${parsedData.sections.experience}\n\n`
  }
  
  if (parsedData.sections.education) {
    formattedText += `EDUCATION:\n${parsedData.sections.education}\n\n`
  }
  
  if (parsedData.sections.skills) {
    formattedText += `SKILLS:\n${parsedData.sections.skills}\n\n`
  }
  
  if (parsedData.sections.certifications) {
    formattedText += `CERTIFICATIONS:\n${parsedData.sections.certifications}\n\n`
  }
  
  return formattedText
}

