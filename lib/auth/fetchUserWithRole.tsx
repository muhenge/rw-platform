import { redirect } from "next/navigation";
import { apiClient } from "@/lib/axiosInstance";

export async function fetchUserWithRole(token: string) {
  try {
    const response = await apiClient.get("/user/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user with role:", error);
    redirect('/signin');
    return null;
  }
}
