# OAuth deployment checklist

The Worker will use server-side authorization-code flows and Cloudflare Secrets. Do not place any provider secret in the repository or browser JavaScript.

## GitHub

Create an OAuth App with homepage URL `https://bpmuseum.org.cn` and callback URL:

`https://api.bpmuseum.org.cn/api/oauth/github/callback`

Store the generated values as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` Cloudflare Secrets. The application requests only `read:user` and `user:email` and does not store GitHub access tokens.

## Microsoft

Create an app registration that accepts personal Microsoft accounts and configure this redirect URI:

`https://api.bpmuseum.org.cn/api/oauth/microsoft/callback`

The Worker will need `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` as Cloudflare Secrets.

## Sign in with Apple

Create a Services ID for the website and configure this return URL:

`https://api.bpmuseum.org.cn/api/oauth/apple/callback`

The Worker will need `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and the downloaded Sign in with Apple private key as `APPLE_PRIVATE_KEY` Cloudflare Secrets.

Apple only provides a user's name on the first successful authorization. The Worker therefore records the provider subject as the durable identity and treats email as optional profile data.
