export const runtime = 'nodejs'

export async function POST() {
  return Response.json({ ok: false, error: 'Hlidac Statu live source is disabled.' }, { status: 410 })
}
