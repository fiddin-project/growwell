# Backend plugins

- `apiContract.js` defines reusable JSON schemas and attaches request/response contracts to every `/api` route.
- `openapi.js` registers OpenAPI 3.0 generation and the optional Swagger UI.
- `errorEnvelope.js` normalizes JSON errors with stable codes and request IDs.

Any new API route must be added to `apiContract.js`; application startup fails when a success-response contract is missing.
