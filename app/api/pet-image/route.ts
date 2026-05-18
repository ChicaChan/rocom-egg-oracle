import petsData from "@/data/pets.json";
import { NextRequest, NextResponse } from "next/server";

type PetImageRecord = {
  name: string;
  petId: number;
  imagePath: string;
};

const pets = petsData as PetImageRecord[];

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim();
  const petId = request.nextUrl.searchParams.get("petId")?.trim();

  if (!name && !petId) {
    return NextResponse.json({ error: "missing name or petId" }, { status: 400 });
  }

  const pet = pets.find((item) => {
    if (petId && String(item.petId) === petId) {
      return true;
    }

    if (name && item.name === name) {
      return true;
    }

    return false;
  });

  if (!pet) {
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
