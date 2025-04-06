import fs from 'fs/promises';

export async function renderTemplate(templatePath, replacements) {
  let template = await fs.readFile(templatePath, 'utf-8');

  // Handle conditional sections (like {{#VIDEO_EMBED}}{{VIDEO_EMBED}}{{/VIDEO_EMBED}})
  for (const key in replacements) {
    if (key.startsWith('#')) {
      const actualKey = key.substring(1);
      const value = replacements[key];

      if (value) {
        template = template.replace(
          new RegExp(`{{#${actualKey}}}(.*?){{/${actualKey}}}`, 's'),
          (_, content) => content.replace(`{{${actualKey}}}`, value)
        );
      } else {
        template = template.replace(
          new RegExp(`{{#${actualKey}}}.*?{{/${actualKey}}}`, 's'),
          ''
        );
      }
    }
  }

  // Replace regular placeholders
  return Object.entries(replacements)
    .filter(([key]) => !key.startsWith('#'))
    .reduce(
      (html, [key, value]) => html.replaceAll(`{{${key}}}`, value),
      template
    );
}
