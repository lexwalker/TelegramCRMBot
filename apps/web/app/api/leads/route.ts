import { NextResponse } from "next/server";
import { listLeads } from "../../../lib/leads";

export async function GET() {
  try {
    const leads = await listLeads();
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Не удалось получить заявки",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
