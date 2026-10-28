export function renderBackground(page) {
  if (!page.background) {
    return "";
  }

  const imagePath = `public/${page.background}`;

  return `\\AddToShipoutPictureBG*{
    \\AtPageUpperLeft{
      \\raisebox{-\\height}{
        \\makebox[\\paperwidth][c]{
          \\includegraphics[
  width=\\paperwidth
]{${imagePath}}
        }
      }
    }
  }`;
}

function renderCard(page) {
  if (!page.background) {
    return "";
  }

  return `\\AddToShipoutPictureBG*{
  \\AtPageLowerLeft{
    \\hspace*{0.07\\paperwidth}
    \\color{white}
    \\rule{0.86\\paperwidth}{0.62\\paperheight}
  }
}`;
}

export function renderPhotoPageStart(page) {
  return `${renderBackground(page)}
${renderCard(page)}

${page.background ? "\\vspace*{0.30\\paperheight}" : ""}`;
}