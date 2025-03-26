export async function POST(req: Request) {
  const body = await req.json()
  console.log("🚀 ~ POST ~ body:", body)

  return new Response(JSON.stringify({ hello: "world" }))
}
