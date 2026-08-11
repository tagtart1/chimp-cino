import { apiUrl } from "../config/api";

export async function fetchSessionUser() {
  const response = await fetch(apiUrl("/users/validate-user"), {
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "Unable to validate session");
    error.code = payload.code;
    error.status = response.status;
    throw error;
  }

  return payload.data;
}
