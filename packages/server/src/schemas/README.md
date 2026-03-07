# Endpoints

## Get Passkey

GET {tenancyId}/passkeys/{authenticatorId}
Authorization: Bearer {apiKeyToken}

Response status: 200, 404
Response content type: application/json
Response type: Passkey

## Delete Passkey

DELETE {tenancyId}/passkeys/{authenticatorId}
Authorization: Bearer {apiKeyToken}

Response status 202, 404

## Assign user

PATCH {tenancyId}/passkeys/{authenticatorId}
Authorization: Bearer {apiKeyToken}

Request body

```
{
  userId: "xxx"
}
```

Response status 202, 404

## AAGUID Icon

GET /aaguid/{aaguid}/icon.svg

Response status: 200, 404
Response content type: image/svg+xml
