# Local Express Daegu website

GitHub Pages deployment package.

Upload the contents of this folder to the root of a GitHub repository.

Root files:
- index.html
- methodology.html
- assets/
- .nojekyll

GitHub Pages setting:
- Source: Deploy from a branch
- Branch: main
- Folder: /root

Custom domain:
- Add a CNAME file later only when the domain is ready to connect.


Public wording note:
- Organization status is described as `Nonprofit Arts Organization / 비영리 예술단체` for public-facing caution.


v03 mobile stabilization:
- Added mobile CSS patch for index.html and methodology.html.
- Prevents horizontal overflow on small screens.
- Stacks side cards, image cards, reference plates, footer, and contact sections vertically on mobile.
