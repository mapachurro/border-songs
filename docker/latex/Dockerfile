FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        texlive-luatex \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-fonts-recommended \
        fonts-urw-base35 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /work

ENTRYPOINT ["lualatex"]