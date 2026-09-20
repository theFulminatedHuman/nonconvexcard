# nonconvexcard

The mathematical foundations of modern AI — from probability to optimization, learning theory, deep
learning, and modern LLM systems.

**Live at https://thefulminatedhuman.github.io/nonconvexcard/**

An interactive mathematical laboratory rather than a course: rigorous theory with its hypotheses
stated, proofs you can fold away until you have tried, reproducible seeded experiments, a problem
database that runs your code in the browser, and an explicit distinction between what is proved,
what is only measured, and what nobody knows.

## Layout

```
lab/                      the application — see lab/README.md
  content/                topics, problems, papers and judge specs
  src/                    Next.js app, components and libraries
  docs/AUTHORING.md       how to add a topic, problem, experiment, paper or judge
.github/workflows/        builds lab/ and deploys it to GitHub Pages
```

Everything of substance is under `lab/`. This root holds only the deployment workflow.

## Running it

```bash
cd lab
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for the mathematical utilities
npm run build      # static export into lab/out/
```

## Deployment

`.github/workflows/deploy-lab.yml` builds the static export and publishes it to GitHub Pages on
pushes to the default branch that touch `lab/**`, and on demand via *Run workflow*.

It derives the site's base path from the repository name, so a project page served at
`https://<owner>.github.io/<repo>/` needs no configuration — but **GitHub Pages must be set to
deploy from GitHub Actions** (Settings → Pages → Source → GitHub Actions). With the legacy
"Deploy from a branch" source, GitHub builds the repository root with Jekyll and ignores the
workflow's artifact entirely.

## Licence

MIT — see [LICENSE](LICENSE).

## History

This repository previously held an [Academic Pages](https://github.com/academicpages/academicpages.github.io)
personal site. That template and its licence have been removed; none of its code remains.
