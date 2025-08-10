import axios from "axios";
import { redirect } from "next/navigation";
export async function fetchUserWithRole(token: string) {
  try {
    const res = await axios.get("http://localhost:3005/api/user/me", {
      headers: {
        Authorization: `Bearer ${}`,
        "Content-Type": "application/json"
      },
      timeout: 10000,
    });

    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      redirect('/signup')
    } else {
      console.error("Unexpected error:", error);
    }
    return null;
  }
}
