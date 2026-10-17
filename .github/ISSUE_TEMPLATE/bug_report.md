---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Run '...'
2. Open '...'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Output**
Paste the output of `docker compose ps -a` and the relevant part of `docker compose logs <service>`.

**Environment (please complete the following information):**

- OS: [e.g. Windows 11, macOS 15, Ubuntu 24.04]
- Docker version: [output of `docker version --format '{{.Server.Version}}'`]
- Compose version: [output of `docker compose version`]
- Versions from `.env`: [ECOM_API_VERSION, ECOM_ADMIN_VERSION, ECOM_WEB_VERSION]

**Additional context**
Add any other context about the problem here. Application bugs (API, admin, storefront) belong in the app repository; see the README.
