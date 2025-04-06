export function formatSectionTitle(sectionId) {
    const sectionMap = {
      '01-reach-the-pass': 'Side 1: Reach the Pass',
      '02-behold-the-valley-beyond': 'Side 2: Behold the Valley Beyond',
      '03-alcanzar-la-ribera': 'Side 3: Alcanzar la Ribera',
      '04-desde-la-otra-costa': 'Side 4: Desde la Otra Costa'
    };
  
    return sectionMap[sectionId] || sectionId;
  }
  