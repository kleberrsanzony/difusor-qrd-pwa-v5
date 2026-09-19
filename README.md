# Difusor Lab

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![PWA](https://img.shields.io/badge/PWA-offline--ready-blue)

**Difusor Lab** is a lightweight Progressive Web App for planning DIY acoustic diffusers. It helps turn diffuser parameters into a practical build plan with dimensions, a placement map, material estimates, a cut list, a stock-cutting plan and a print-ready PDF.

> 🇧🇷 [Leia em Português](#português)

## Features

- Skyline 2D block diffuser planning
- QRD 1D well diffuser planning
- Automatic fit to the selected panel/base size
- Manual horizontal and vertical repetitions
- Prime sequence options: 5, 7, 11, 13, 17, 19 and 23
- Centimeter and meter units
- Configurable maximum depth, block dimensions and base dimensions
- Saw kerf calculation
- Safety/reserve percentage for extra pieces
- Estimated acoustic operating range
- Approximate panel weight
- Assembly map with level/depth visualization
- Piece and material lists
- Stock cutting plan showing how pieces can be obtained from each timber length
- Printable/PDF project document
- Installable PWA with offline support after the first load

## Why this project exists

Building a QRD or Skyline diffuser requires translating acoustic parameters into real woodworking decisions: how many pieces are needed, what lengths to cut, how much timber to buy, how to account for blade loss, and where each piece goes.

Difusor Lab brings those steps into a single browser-based tool so makers, home-studio owners, musicians and audio enthusiasts can move from a diffuser concept to a practical construction plan.

## Run locally

No build system or package installation is required.

```bash
git clone https://github.com/kleberrsanzony/difusor-qrd-pwa-v5.git
cd difusor-qrd-pwa-v5
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

A local HTTP server is recommended because the project includes a web manifest and service worker.

## Project structure

```text
.
├── index.html            # UI and project controls
├── app.js                # calculations, rendering and PDF/print generation
├── styles.css            # application and print styles
├── manifest.webmanifest  # PWA metadata
├── sw.js                 # offline/service-worker behavior
├── icons/                # application icons
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## Calculation inputs

The interface currently allows configuration of:

- diffuser type;
- prime sequence `N`;
- maximum depth;
- horizontal/vertical repetitions;
- real block face dimensions;
- panel/base width and height;
- base thickness;
- purchased stock length;
- saw kerf;
- reserve percentage;
- speed of sound.

The application also includes an **auto-fit** mode where the selected base dimensions determine the number of cells used in the layout.

## Output

A generated project can include:

1. panel dimensions and summary metrics;
2. diffuser assembly map;
3. exact piece quantities and quantities including reserve;
4. material list;
5. cutting plan per timber stock length;
6. summarized assembly steps;
7. paginated print/PDF output.

## Technical notes

Difusor Lab is intentionally dependency-light and runs as a static web application using HTML, CSS and vanilla JavaScript.

The displayed acoustic frequency range is a **theoretical estimate**. It is not a substitute for room measurement, acoustic simulation, structural evaluation or professional acoustic design.

## Contributing

Contributions are welcome. Bug reports, documentation improvements, calculation reviews, accessibility improvements and new features can be proposed through GitHub Issues or Pull Requests.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a change.

## Roadmap ideas

Potential areas for future contribution include:

- automated tests for acoustic and cutting calculations;
- additional diffuser geometries;
- improved validation of physical construction constraints;
- project import/export;
- localization;
- accessibility improvements;
- printable labels for cut pieces;
- comparison between alternative panel configurations.

## License

Released under the [MIT License](LICENSE).

Copyright © 2026 Kleber Sanzony.

---

# Português

**Difusor Lab** é uma PWA leve para planejar a construção de difusores acústicos. A ferramenta transforma parâmetros do projeto em informações práticas de marcenaria: dimensões, mapa de montagem, estimativa de materiais, lista de peças, plano de corte e documento pronto para impressão/PDF.

## Recursos

- cálculo para difusores Skyline 2D com blocos;
- cálculo para difusores QRD 1D com poços;
- preenchimento automático da base;
- repetições horizontais e verticais em modo manual;
- sequências primas 5, 7, 11, 13, 17, 19 e 23;
- unidades em centímetros e metros;
- configuração de profundidade máxima, dimensões dos blocos e da base;
- cálculo da perda causada pelo corte da serra (kerf);
- margem de segurança para peças extras;
- estimativa teórica da faixa de atuação acústica;
- estimativa do peso do painel;
- mapa visual de montagem;
- lista de peças e materiais;
- plano de corte por barrote;
- exportação para impressão/PDF;
- instalação como PWA e funcionamento offline após a primeira abertura.

## Executar localmente

```bash
git clone https://github.com/kleberrsanzony/difusor-qrd-pwa-v5.git
cd difusor-qrd-pwa-v5
python3 -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

## Como contribuir

Issues e Pull Requests são bem-vindos, especialmente para correções de cálculos, testes, acessibilidade, documentação e novas funcionalidades.

Consulte [CONTRIBUTING.md](CONTRIBUTING.md).

## Aviso técnico

As estimativas acústicas exibidas pelo aplicativo são teóricas e não substituem medições da sala, simulações especializadas, análise estrutural ou projeto acústico profissional.

## Licença

Distribuído sob a [Licença MIT](LICENSE).
