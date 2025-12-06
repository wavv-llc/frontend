import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { connectionApi } from '@/lib/api'

const SHAREPOINT_CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID || ''
const SHAREPOINT_CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET || ''
const SHAREPOINT_REDIRECT_URI = process.env.SHAREPOINT_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/sharepoint/callback`
const SHAREPOINT_TENANT_ID = process.env.SHAREPOINT_TENANT_ID || 'common'
const TOKEN_URL = `https://login.microsoftonline.com/${SHAREPOINT_TENANT_ID}/oauth2/v2.0/token`
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { getToken } = await auth()
    const token = await getToken()

    if (!token) {
      return new NextResponse(
        '<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "Not authenticated" }, "*"); window.close();</script></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Verify state
    const storedState = request.cookies.get('sharepoint_oauth_state')?.value
    if (!state || state !== storedState) {
      return new NextResponse(
        '<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "Invalid state" }, "*"); window.close();</script></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    if (error) {
      return new NextResponse(
        `<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "${error}" }, "*"); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    if (!code) {
      return new NextResponse(
        '<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "No authorization code" }, "*"); window.close();</script></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SHAREPOINT_CLIENT_ID,
        client_secret: SHAREPOINT_CLIENT_SECRET,
        code,
        redirect_uri: SHAREPOINT_REDIRECT_URI,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Files.Read.All https://graph.microsoft.com/Sites.Read.All offline_access',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return new NextResponse(
        `<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "Token exchange failed" }, "*"); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Get user info from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    let userName = 'SharePoint'
    if (userResponse.ok) {
      const userData = await userResponse.json()
      userName = userData.displayName || userData.userPrincipalName || 'SharePoint'
    }

    // Save connection to backend
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : undefined

    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'SHAREPOINT',
        name: userName,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      }),
    })

    if (!backendResponse.ok) {
      return new NextResponse(
        '<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "Failed to save connection" }, "*"); window.close();</script></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    // Success - send message to opener
    return new NextResponse(
      '<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_SUCCESS" }, "*"); window.close();</script></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (error) {
    console.error('SharePoint callback error:', error)
    return new NextResponse(
      `<html><body><script>window.opener.postMessage({ type: "SHAREPOINT_AUTH_ERROR", error: "${error instanceof Error ? error.message : 'Unknown error'}" }, "*"); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

