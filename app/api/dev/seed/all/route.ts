import { childLogger } from "@/lib/logger";
import dbConnect, { getCollection } from "@/lib/mongodb";
import {
  MOCK_APPOINTMENTS,
  MOCK_INVOICES,
  MOCK_PARTNERS,
  MOCK_SPECIALITIES,
  MOCK_USERS,
} from "@/mocks";
import { NextRequest, NextResponse } from "next/server";

function normalizeUserRoles(roles: string[] | undefined): string[] {
  if (!Array.isArray(roles)) return ["CUSTOMER"];
  const out = new Set<string>();
  for (const r of roles) {
    if (r === "ADMIN" || r === "CUSTOMER" || r === "CSM" || r === "PROVIDER") {
      out.add(r);
    } else if (r.startsWith("{PROVIDER:")) {
      out.add("PROVIDER");
    }
  }
  if (out.size === 0) out.add("CUSTOMER");
  return Array.from(out);
}

/**
 * Route de développement pour seed la base de données
 * ⚠️ DÉSACTIVÉE EN PRODUCTION
 * Utilise les données mock pour peupler la base de données de développement
 * 
 * Seed les collections suivantes :
 * - users
 * - partners
 * - specialities
 * - bookings
 * - invoices
 */
export async function POST(request: NextRequest) {
  const reqId = request.headers.get("x-request-id") || undefined;
  const log = childLogger({ requestId: reqId, route: "dev/seed/all" });
  
  // Protection : Désactiver en production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Forbidden in production" },
      { status: 403 },
    );
  }

  try {
    await dbConnect();

    // Users
    const usersCol = await getCollection("users");
    let usersUpserted = 0;
    for (const u of MOCK_USERS) {
      const doc = {
        email: u.email,
        name: u.name,
        phone: u.phone,
        company: (u as any).company,
        address: (u as any).address,
        roles: normalizeUserRoles((u as any).roles),
        status: (u as any).status || "ACTIVE",
        specialty: (u as any).specialty,
        recommended: (u as any).recommended || false,
        apiGeo: (u as any).apiGeo || [],
        clientNotes: (u as any).clientNotes,
        avatar: (u as any).avatar?.image || (u as any).image,
        preferences: (u as any).preferences,
        password: (u as any).password || "password123",
        emailVerified: (u as any).emailVerified || false,
        images: (u as any).images || [],
        firstName: (u as any).firstName,
        lastName: (u as any).lastName,
        dateOfBirth: (u as any).dateOfBirth,
        countryOfResidence: (u as any).countryOfResidence,
        targetCountry: (u as any).targetCountry,
        targetCity: (u as any).targetCity,
        selectedServices: (u as any).selectedServices,
        monthlyBudget: (u as any).monthlyBudget,
        securityQuestion: (u as any).securityQuestion,
        securityAnswer: (u as any).securityAnswer,
        marketingConsent: (u as any).marketingConsent || false,
        kycConsent: (u as any).kycConsent || false,
      };
      const res = await usersCol.updateOne(
        { email: u.email },
        { $set: doc },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) usersUpserted += 1;
    }

    // Partners
    const partnersCol = await getCollection("partners");
    let partnersUpserted = 0;
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
      const res = await partnersCol.updateOne(
        { website: p.website },
        { $set: doc },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) partnersUpserted += 1;
    }

    // Specialities
    const specsCol = await getCollection("specialities");
    let specsUpserted = 0;
    for (const s of MOCK_SPECIALITIES) {
      const doc = {
        name: s.name,
        type: (s as any).group || (s as any).type || "general",
      };
      const res = await specsCol.updateOne(
        { name: s.name },
        { $set: doc },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) specsUpserted += 1;
    }

    // Bookings
    const bookingsCol = await getCollection("bookings");
    let bookingsUpserted = 0;
    for (const b of MOCK_APPOINTMENTS) {
      const doc: any = {
        reservationNumber: b.reservationNumber,
        requesterId: b.requesterId,
        beneficiary: b.beneficiary,
        providerId: b.providerId,
        serviceId: b.serviceId,
        date: b.date,
        timeslot: b.timeslot,
        status: b.status,
        paymentStatus: b.paymentStatus,
        totalAmount: b.totalAmount,
        notes: b.notes,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
      const res = await bookingsCol.updateOne(
        { reservationNumber: b.reservationNumber },
        { $set: doc },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) bookingsUpserted += 1;
    }

    // Invoices
    const invoicesCol = await getCollection("invoices");
    let invoicesUpserted = 0;
    for (const inv of MOCK_INVOICES) {
      const doc = {
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        providerId: inv.providerId,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        paidDate: inv.paidDate,
        items: inv.items,
        notes: inv.notes,
        userId: (inv as any).userId || (inv as any).customerId,
      };
      const res = await invoicesCol.updateOne(
        { invoiceNumber: inv.invoiceNumber },
        { $set: doc },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) invoicesUpserted += 1;
    }

    log.info({
      msg: "Seed completed",
      users: usersUpserted,
      partners: partnersUpserted,
      specialities: specsUpserted,
      bookings: bookingsUpserted,
      invoices: invoicesUpserted,
    });

    return NextResponse.json({
      ok: true,
      users: usersUpserted,
      partners: partnersUpserted,
      specialities: specsUpserted,
      bookings: bookingsUpserted,
      invoices: invoicesUpserted,
    });
  } catch (err: any) {
    const reqId2 = request.headers.get("x-request-id") || undefined;
    const log2 = childLogger({ requestId: reqId2, route: "dev/seed/all" });
    log2.error({ err, msg: "Seeding failed" });
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  }
}
