import { cookies } from "next/headers";
import { fetchUserWithRole } from "./fetchUserWithRole";

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session");

  if (!session) return null;

  const token = session.value;
  const user = await fetchUserWithRole(token);

  return user;
}
