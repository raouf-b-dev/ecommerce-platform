# Security Policy

This repository runs the published images of the ecommerce apps for local evaluation. It contains no application code, so most vulnerabilities belong to one of the app repositories, each with its own policy:

| Component | Policy |
| :-------- | :----- |
| API | [ecommerce-store-api SECURITY.md](https://github.com/raouf-b-dev/ecommerce-store-api/blob/master/SECURITY.md) |
| Admin dashboard | [ecommerce-admin-dashboard SECURITY.md](https://github.com/raouf-b-dev/ecommerce-admin-dashboard/blob/master/SECURITY.md) |
| Storefront | [ecommerce-store-web SECURITY.md](https://github.com/raouf-b-dev/ecommerce-store-web/blob/master/SECURITY.md) |

## Scope of this repository

This stack is a local demo, not a production deployment:

- `.env.example` holds demo passwords and a demo metrics key. They are public by design.
- The API runs with demo data, mock payments and Swagger enabled.
- The JWT signing key is generated on first start and stored only in the `jwt_keys` Docker volume.
- Do not expose these ports to the internet or reuse these values on a server.

Issues specific to this repository (for example a compose setting that publishes a service it should not, or a committed secret) are in scope here.

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

1. **Email**: [rbdz@hotmail.fr](mailto:rbdz@hotmail.fr)
2. **Subject**: `[SECURITY] ecommerce-platform: Brief description`
3. **Include**: description, steps to reproduce, potential impact, suggested fix (if any)

You can also use GitHub **Private vulnerability reporting** on the affected repository.

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 5 business days
- **Fix or mitigation**: Dependent on severity
