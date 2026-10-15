import { siteUrl } from "./siteUrl.js";

export function getReadingOrder(sections, songs) {
  const orderedSections = [...sections].sort(
    (a, b) => a.data.order - b.data.order,
  );

  const pages = [
    {
      title: "Border Songs",
      href: siteUrl(),
    },
    {
      title: "Table of Contents",
      href: siteUrl("toc/"),
    },
    {
      title: "Introduction",
      href: siteUrl("introduction/"),
    },
  ];

  for (const section of orderedSections) {
    const sectionId = section.id.split("/")[0];

    pages.push({
      title: section.data.title,
      href: siteUrl(`${sectionId}/`),
    });

    const sectionSongs = songs
      .filter((song) => song.id.startsWith(`${sectionId}/`))
      .sort((a, b) => a.id.localeCompare(b.id));

    for (const song of sectionSongs) {
      pages.push({
        title: song.data.title,
        href: siteUrl(`${song.id}/`),
      });
    }
  }

  return pages;
}
