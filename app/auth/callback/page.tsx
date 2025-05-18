import { auth } from "@/lib/auth"
import { CallbackView } from "@/components/views/auth/CallbackView"
import { headers } from "next/headers"

export default async function Page() {
  // Get session data on the server
  let session = null;
  let error = null;
  
  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (err) {
    error = err as Error;
    console.error("Error fetching session:", error);
  }
  
  // Pass session data to the client component
  return <CallbackView session={session} isLoading={false} error={error} />;
}