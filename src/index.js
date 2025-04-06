await buildContentPages({
  binderDir,
  buildDir,
  contentTemplate,
  navIndex,
  songPages: await getOrderedSongPagesFromFilenames(binderDir)
});
