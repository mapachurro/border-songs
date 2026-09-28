# Print renderer dependencies

Dependencies required to reproduce the Border Songs print edition.

## Fonts

### Nimbus Roman

Used for:
- NTA / DHS form text

Required faces:
- Regular
- Bold
- Italic
- Bold Italic

Current source:
- Debian package: `fonts-urw-base35`

Status:
- Included in current Docker prototype

### Nimbus Mono PS

Used for:
- NTA entered / machine-generated data

Required faces:
- Regular
- Bold

Current source:
- Debian package: `fonts-urw-base35`

Status:
- Included in current Docker prototype

## TeX packages

### fontspec

Used for:
- OpenType font selection

Provided by:
- `texlive-luatex`

### geometry

Used for:
- Letter-size document geometry
- NTA prototype

Provided by:
- `texlive-latex-recommended`

## Build requirements

- LuaLaTeX
- luaotfload
- fontconfig

## Templates

### NTA / DHS

Fonts:
- Nimbus Roman
- Nimbus Mono PS

TeX packages:
- fontspec
- geometry

Paper:
- US Letter

Status:
- Prototype working