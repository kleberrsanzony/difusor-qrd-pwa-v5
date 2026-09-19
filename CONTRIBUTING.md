# Contributing to Difusor Lab

Thank you for considering a contribution.

Difusor Lab is an open-source tool for planning DIY acoustic diffusers. Contributions that improve correctness, usability, accessibility, documentation, testing or maintainability are welcome.

## Ways to contribute

You can help by:

- reporting reproducible bugs;
- reviewing or validating calculations;
- improving documentation;
- improving accessibility and keyboard usability;
- adding automated tests;
- proposing support for additional diffuser geometries;
- improving print/PDF output;
- improving localization;
- simplifying code without changing results.

## Before opening an issue

Please check whether a similar issue already exists. When reporting a calculation problem, include enough information to reproduce it, such as:

- diffuser type;
- sequence `N`;
- panel/base dimensions;
- block dimensions;
- maximum depth;
- stock length;
- saw kerf;
- reserve percentage;
- expected result and actual result.

Screenshots are useful when the problem is visual.

## Development setup

The project is a static PWA and does not currently require a package manager or build step.

```bash
git clone https://github.com/kleberrsanzony/difusor-qrd-pwa-v5.git
cd difusor-qrd-pwa-v5
python3 -m http.server 8080
```

Open `http://localhost:8080` in a modern browser.

## Pull requests

1. Fork the repository.
2. Create a branch for the change.
3. Keep the change focused on one problem or feature.
4. Test the application in a browser.
5. Verify that the PWA still loads and that existing calculations continue to work.
6. If the change affects calculations, describe the formula or reasoning and provide an example that can be independently checked.
7. Open a Pull Request with a clear explanation of what changed and why.

## Calculation changes

Calculation-related contributions should favor reproducibility over intuition. Please document:

- the formula or algorithm being changed;
- units used internally;
- assumptions;
- at least one before/after example;
- references when an acoustic formula comes from an external technical source.

Do not present theoretical estimates as guaranteed real-world acoustic performance.

## Code style

The current codebase uses plain HTML, CSS and JavaScript. Please keep changes dependency-light unless a new dependency provides a clear maintenance or correctness benefit.

Prefer:

- descriptive variable and function names;
- small, reviewable changes;
- comments that explain *why*, not obvious syntax;
- accessible HTML and controls;
- graceful behavior on mobile and desktop.

## Documentation language

English documentation helps the wider open-source community. Portuguese documentation is also welcome and encouraged. Important user-facing documentation may be maintained bilingually.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
