export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "rocom-egg-predictor",
    timestamp: new Date().toISOString(),
  });
}
