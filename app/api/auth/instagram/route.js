export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.IG_APP_ID,
    redirect_uri: process.env.IG_REDIRECT_URI,
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages'
  });

  return Response.redirect(
    `https://www.instagram.com/oauth/authorize?${params.toString()}`
  );
}
