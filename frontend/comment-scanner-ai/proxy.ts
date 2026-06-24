if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "default_auth_secret_key_12345_comment_scanner";
}

import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ["/dashboard", "/projects/:path*"],
};
