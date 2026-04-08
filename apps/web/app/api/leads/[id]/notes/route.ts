import { NextResponse } from "next/server";
import { addLeadNote } from "../../../../../lib/leads";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { text?: string };

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Текст заметки обязателен" }, { status: 400 });
  }

  try {
    const note = await addLeadNote(id, body.text.trim());
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Не удалось сохранить заметку",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
