import { childLogger } from "@/lib/logger";
import dbConnect, { getCollection } from "@/lib/mongodb";
import { MOCK_PARTNERS } from "@/mocks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const reqId = request.headers.get("x-request-id") || undefined;
  const log = childLogger({ requestId: reqId, route: "dev/seed/partners" });

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Forbidden in production" },
      { status: 403 }
    );
  }

  try {
    await dbConnect();
    const col = await getCollection("partners");

    let upserted = 0;
    for (const p of MOCK_PARTNERS) {
      const doc = {
        name: p.name,
        logo: p.logo,
        description: p.description,
        website: p.website,
        category: p.category,
        services: Array.isArray(p.services) ? p.services : [],
        location: p.location,
        established: p.established,
      };
      const res = await col.updateOne(
        { website: p.website },
        { $set: doc },
        { upsert: true }
      );
      if (res.upsertedCount || res.modifiedCount) upserted += 1;
    }

    log.info({ msg: "Partners seeded", count: upserted });
    return NextResponse.json({ ok: true, count: upserted });
  } catch (err: any) {
    log.error({ err, msg: "Seeding partners failed" });
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  }
}
