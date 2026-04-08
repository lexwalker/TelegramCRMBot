import { NextResponse } from "next/server";
import type { LeadStatus } from "@crm-bot/db";
import { updateLeadStatus } from "../../../../../lib/leads";

const allowedStatuses: LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status?: LeadStatus };

  if (!body.status) {
    return NextResponse.json({ error: "Статус обязателен" }, { status: 400 });
  }

  if (!allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  try {
    const lead = await updateLeadStatus(id, body.status);
    return NextResponse.json(lead);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Не удалось обновить статус",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
