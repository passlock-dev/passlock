# Endpoints

## Get Passkey

GET /v2/{tenancyId}/passkeys/{authenticatorId}
Authorization: Bearer {apiKeyToken}

Response status: 200, 404
Response content type: application/json
Response type: Passkey

## Delete Passkey

DELETE /v2/{tenancyId}/passkeys/{authenticatorId}
Authorization: Bearer {apiKeyToken}

Response status 202, 404

## Update passkey

PATCH /v2/{tenancyId}/passkeys/{authenticatorId}
Authorization: Bearer {apiKeyToken}

Request body

```
{
  username: "jdoe@example.com"
}
```

Response status 202, 404

## AAGUID Icon

GET /aaguid/{aaguid}/icon.svg

Response status: 200, 404
Response content type: image/svg+xml
