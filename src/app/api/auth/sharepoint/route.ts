import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// SharePoint OAuth configuration
// These should be set in your environment variables
const SHAREPOINT_CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID || ''
const SHAREPOINT_CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET || ''
const SHAREPOINT_REDIRECT_URI = process.env.SHAREPOINT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/sharepoint/callback`
const SHAREPOINT_TENANT_ID = process.env.SHAREPOINT_TENANT_ID || 'common' // Use 'common' for multi-tenant

// Microsoft Graph API endpoints
const AUTHORIZE_URL = `https://login.microsoftonline.com/${SHAREPOINT_TENANT_ID}/oauth2/v2.0/authorize`
const TOKEN_URL = `https://login.microsoftonline.com/${SHAREPOINT_TENANT_ID}/oauth2/v2.0/token`

export async function GET(request: NextRequest) {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    if (!token) {
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID()
    
    // Store state in a cookie (in production, use httpOnly, secure cookies)
    const response = NextResponse.redirect(
      `${AUTHORIZE_URL}?` +
      `client_id=${encodeURIComponent(SHAREPOINT_CLIENT_ID)}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(SHAREPOINT_REDIRECT_URI)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent('https://graph.microsoft.com/Files.Read.All https://graph.microsoft.com/Sites.Read.All offline_access')}&` +
      `state=${state}`
    )

    // Store state in cookie (in production, use httpOnly, secure cookies)
    response.cookies.set('sharepoint_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('SharePoint OAuth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate SharePoint authentication' },
      { status: 500 }
    )
  }
}

