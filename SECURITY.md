# Security policy

This is the website of Jönköping University AI Student Association (JU AIS), a non-commercial student association run by volunteers.

The EU Cyber Resilience Act (CRA) most likely does not apply to us: we are not a commercial actor, and this is a website, not a product placed on the market. We still follow its core practices voluntarily: a clear way to report vulnerabilities, fixing what is reported, keeping dependencies up to date and publishing an SBOM.

## Report a vulnerability

Please report privately, not in a public issue:

- **Preferred:** GitHub private vulnerability reporting on this repo (Security → Report a vulnerability).
- **Email:** ju.ai.student.association@gmail.com

Include what you found, where, and how to reproduce it.

## What we commit to

- The Head of Tech & Platform acknowledges your report as soon as we can. We are a volunteer student board, so this can take longer during exam periods and holidays.
- We investigate, fix confirmed issues and tell you when the fix is live.
- We credit you if you want to be credited.
- We will not take legal action against anyone who reports in good faith, avoids accessing personal data and gives us reasonable time to fix the issue before disclosing it.

## Scope

In scope: this repository and the site at https://juais.se.

Out of scope: third-party services we link to or embed (HiTract, Discord, Google Forms, GitHub itself). Report those to their owners.

## How we keep the site safe

- Static site, no backend, no logins for visitors.
- No secrets (passwords, tokens, keys) and no personal data in the repo. Membership data lives in HiTract, not here.
- Dependencies are kept few and updated regularly.
- SBOM (CycloneDX) for every deployed build: https://juais.se/sbom.cdx.json
