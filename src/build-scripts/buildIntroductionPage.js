



async function buildIntroductionPage() {
  try {
    console.log('Building introduction page...');
    const introMd = await fs.readFile(path.join(binderDir, 'introduction.md'), 'utf-8');
    
    // Don't use splitMarkdownSections here since the introduction format is different
    const introHtml = await renderTemplate(path.resolve(__dirname, 'intro-template.html'), {
      ASSET_PATH: '',
      TITLE: 'Introduction',
      CONTENT: marked.parse(introMd),
      PREV_BUTTON: '',
      NEXT_BUTTON: '',
    });
    
    await fs.writeFile(path.join(buildDir, 'introduction.html'), introHtml);
    console.log('✅ Introduction page built successfully');
    
    // Add to navigation index in the correct position (after TOC)
    const tocIndex = navIndex.indexOf('toc.html');
    if (tocIndex !== -1) {
      navIndex.splice(tocIndex + 1, 0, 'introduction.html');
    } else {
      navIndex.push('introduction.html');
    }
  } catch (error) {
    console.error('Error building introduction page:', error);
  }
}
