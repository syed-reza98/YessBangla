import { redirect } from "next/navigation";

/** `/projects` redirects to `/ventures` — canonical portfolio route. */
export default function Page() {
  redirect("/ventures");
}
