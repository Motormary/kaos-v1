import { auth } from "./layout"

export default function Home() {
  if (!auth)
    return (
      <div className="h-screen w-full p-5">
        <div className="max-w-content m-auto grid h-full">
          <h1 className="m-auto text-3xl">You are not logged in</h1>
        </div>
      </div>
    )

  return (
    <div className="h-screen w-full p-5">
      <div className="max-w-content m-auto grid h-full">
        <h1 className="m-auto text-3xl">Logged in!</h1>
      </div>
    </div>
  )
}
