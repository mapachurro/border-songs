import path from 'path';
import fs from 'fs/promises';

export async function copyAssets({ __dirname, buildDir }) {
  await fs.writeFile(path.join(buildDir, '.nojekyll'), '');
  await fs.mkdir(path.join(buildDir, 'js'), { recursive: true });

  const jsDir = path.join(__dirname, 'js');
  const jsFiles = await fs.readdir(jsDir);
  for (const file of jsFiles) {
    await fs.copyFile(
      path.join(jsDir, file),
      path.join(buildDir, 'js', file)
    );
  }

  await fs.copyFile(path.join(__dirname, 'styles.css'), path.join(buildDir, 'styles.css'));

  const bootstrapDir = path.join(__dirname, 'bootstrap');
  const fallback = path.join(__dirname, '../node_modules/bootstrap/dist/css/bootstrap.min.css');

  const bootstrapMinCss = path.join(bootstrapDir, 'bootstrap.min.css');
  const customCss = path.join(bootstrapDir, 'custom.css');

  const exists = async filePath =>
    await fs.stat(filePath).then(() => true).catch(() => false);

  if (await exists(bootstrapMinCss)) {
    await fs.copyFile(bootstrapMinCss, path.join(buildDir, 'bootstrap.min.css'));
  } else if (await exists(fallback)) {
    await fs.copyFile(fallback, path.join(buildDir, 'bootstrap.min.css'));
  }

  if (await exists(customCss)) {
    await fs.copyFile(customCss, path.join(buildDir, 'custom.css'));
  }
}
