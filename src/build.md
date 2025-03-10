# Overview

The index.js file in this directory should be used to build the visual, "frontend" version of the markdown files held in [binder](../binder). 

## Rendering

The structure of the markdown files will be in accordance with [this outline](../binder/structure.md).

[index.js](./index.js) should then perform the following actions to render a frontend for the content, in accordance with the [template](./template.md)

1. Align the titles (`h1 / #`) of the two translated versions
2. Align each line of the `# Source` with each line of the `# Target`