/**
 * SAML Service Provider (SP) Metadata Endpoint
 * This endpoint serves SP metadata XML that IdP administrators can use to configure the SAML relationship.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // In production, you would generate proper SAML SP metadata based on your configuration
  // For now, return a basic template

  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${baseUrl}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${baseUrl}/api/auth/saml/acs" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>`

  return new NextResponse(metadata, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': 'attachment; filename="sp-metadata.xml"',
    },
  })
}
