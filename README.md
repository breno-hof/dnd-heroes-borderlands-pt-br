# dnd-heroes-borderlands-pt-br

Módulo de **tradução de compêndios** (PT-BR) para o módulo `dnd-heroes-borderlands`
(sistema `dnd5e`), usando [Babele](https://foundryvtt.com/packages/babele/).

Este repositório **não contém** o conteúdo original em inglês — apenas as
strings traduzidas, aplicadas em tempo de execução sobre o compêndio do
módulo de origem, que precisa estar instalado separadamente.

---

## 1. Estrutura do projeto

```
dnd-heroes-borderlands-pt-br/
├── module.json                          # Manifest do módulo Foundry
├── scripts/
│   ├── babele-register.js               # Registro no Babele (esmodule, carregado pelo Foundry)
│   ├── generate-translation.mjs         # Gera/atualiza packs/*.json a partir de source/
│   ├── validate-translation.mjs         # Validação usada localmente e no CI
│   └── bump-version.mjs                 # Bump de versão semver (usado pelo release.yml)
├── packs/
│   └── dnd-heroes-borderlands.actors.json  # ARQUIVO QUE VOCÊ TRADUZ
├── source/actors/                       # (gitignored) JSONs originais em inglês — sua matéria-prima local
├── .github/workflows/
│   ├── validate.yml                     # Roda em cada Pull Request
│   └── release.yml                      # Roda em cada push na main: versiona + publica release
├── package.json
├── CHANGELOG.md
└── LICENSE
```