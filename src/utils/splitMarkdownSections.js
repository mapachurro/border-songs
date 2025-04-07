export function splitMarkdownSections(markdown) {
    const sections = {
      title: '',
      authority: '',
      videoSource: '',
      source: '',
      target: '',
      commentary: '',
      notes: '',
      versions: ''
    };
  
    const lines = markdown.split('\n');
    let currentSection = null;
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
  
      if (line.startsWith('# Title:')) {
        sections.title = line.replace('# Title:', '').trim();
        continue;
      }
  
      if (line.startsWith('# Authority:')) {
        sections.authority = line.replace('# Authority:', '').trim();
        continue;
      }
  
      if (line.startsWith('# Video source:')) {
        sections.videoSource = line.replace('# Video source:', '').trim();
        continue;
      }
  
      if (line.startsWith('# Source')) {
        currentSection = 'source';
        continue;
      }
  
      if (line.startsWith('# Target')) {
        currentSection = 'target';
        continue;
      }
  
      if (line.startsWith('# Commentary')) {
        currentSection = 'commentary';
        continue;
      }
  
      if (line.startsWith('# Notes')) {
        currentSection = 'notes';
        continue;
      }
  
      if (line.startsWith('# Versions')) {
        currentSection = 'versions';
        continue;
      }
  
      if (currentSection && sections[currentSection] !== undefined) {
        sections[currentSection] += line + '\n';
      }
    }
  
    for (const key in sections) {
      if (typeof sections[key] === 'string') {
        sections[key] = sections[key].trim();
      }
    }
  
    return sections;
  }
  