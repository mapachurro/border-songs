export function getReadingOrder(sections, songs) {
  const orderedSections = [...sections]
    .sort((a, b) => a.data.order - b.data.order);

const pages = [
  {
    title: 'Border Songs',
    href: '/',
  },
  {
    title: 'Table of Contents',
    href: '/toc/',
  },
  {
    title: 'Introduction',
    href: '/introduction/',
  },
];

  for (const section of orderedSections) {
    const sectionId = section.id.split('/')[0];

    pages.push({
      title: section.data.title,
      href: `/${sectionId}/`,
    });

    const sectionSongs = songs
      .filter((song) => song.id.startsWith(`${sectionId}/`))
      .sort((a, b) => a.id.localeCompare(b.id));

    for (const song of sectionSongs) {
      pages.push({
        title: song.data.title,
        href: `/${song.id}/`,
      });
    }
  }

  return pages;
}