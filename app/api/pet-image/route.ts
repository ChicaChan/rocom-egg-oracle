import { NextRequest, NextResponse } from "next/server";
import { findPetByName, findPetById } from "@/lib/data/pets";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  const idOrPetId = request.nextUrl.searchParams.get("petId")?.trim() ??
    request.nextUrl.searchParams.get("id")?.trim();

  if (!name && !idOrPetId) {
    return NextResponse.json({ error: "missing name or id/petId" }, { status: 400 });
  }

  let pet = idOrPetId ? findPetById(idOrPetId) : undefined;
  if (!pet && name) pet = findPetByName(name);

  if (!pet || !pet.imagePath) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const target = new URL(pet.imagePath, request.nextUrl.origin);
  return NextResponse.redirect(target, {
    status: 307,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "CDN-Cache-Control": "public, max-age=604800",
    },
  });
}
