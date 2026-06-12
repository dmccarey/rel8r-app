import { listBriefings } from "@/lib/briefing-store";

export async function GET() {
  const briefings = await listBriefings();
  return Response.json({ briefings });
}
