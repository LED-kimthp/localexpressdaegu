# Local Express Daegu website

GitHub Pages deployment package.

Upload the contents of this folder to the root of a GitHub repository.

Root files:
- index.html
- methodology.html
- assets/
- over39/
- .nojekyll

GitHub Pages setting:
- Source: Deploy from a branch
- Branch: main
- Folder: /root

Custom domain:
- `localexpressdaegu.org`

## 〈만 39세 이상〉 research survey

- Public path: `/over39/`
- Static survey assets live in `over39/`.
- The homepage links to the survey from the hero, navigation, project index, and project section.
- `over39/config.js` contains the response webhook setting.
- Do not merge the survey to the public branch until a production webhook has been configured and tested. An empty webhook keeps drafts in the participant's browser but does not collect completed responses centrally.


Public wording note:
- Organization status is described as `Nonprofit Arts Organization / 비영리 예술단체` for public-facing caution.


v03 mobile stabilization:
- Added mobile CSS patch for index.html and methodology.html.
- Prevents horizontal overflow on small screens.
- Stacks side cards, image cards, reference plates, footer, and contact sections vertically on mobile.
