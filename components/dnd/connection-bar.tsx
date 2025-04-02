import {
  ScreenShare,
  ScreenShareOff,
  Users,
  Wifi,
  WifiHigh,
  WifiLow,
  WifiOff,
  WifiZero,
} from "lucide-react"
import { Button } from "../ui/button"
import { memo } from "react"
import { DB_User } from "@/supabase/types"

type connectionProps = {
  connectionStatus: string
  users: DB_User[]
  colCount: number
  connectOperator: () => void
  disconnectOperator: () => void
  setOverRef: (target: null) => void
}

const ConnectionBar = ({
  connectionStatus,
  users,
  colCount,
  connectOperator,
  disconnectOperator,
  setOverRef,
}: connectionProps) => {
  const maxWidth = colCount * 342
  return (
    <div
      style={{ maxWidth }}
      onPointerEnter={() => setOverRef(null)}
      className="flex w-full items-baseline justify-between gap-4"
    >
      {connectionStatus === "connected" ? (
        <Button
          className="my-2 w-fit"
          variant={"outline"}
          onClick={() => {
            disconnectOperator()
          }}
        >
          <ScreenShareOff />
          Disconnect
        </Button>
      ) : (
        <Button
          disabled={connectionStatus !== "disconnected"}
          className="my-2 w-fit"
          variant={"outline"}
          onClick={connectOperator}
        >
          <ScreenShare />
          Connect
        </Button>
      )}
      <div className="flex items-baseline justify-end gap-4">
        <div className="text-muted-foreground flex w-fit items-center gap-1 truncate">
          <Users />
          <p className="text-sm">{users?.length ? users.length + 1 : 1}</p>
        </div>
        <div className="[&_span]:text-muted-foreground mb-5 flex items-center gap-2 font-semibold">
          {connectionStatus === "pending" ? <PendingConnection /> : null}
          {connectionStatus === "connected" ? (
            <Wifi className="stroke-green-400" />
          ) : null}
          {connectionStatus === "closing" ? <PendingConnection /> : null}
          {connectionStatus === "disconnected" ? (
            <WifiOff className="stroke-red-600" />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(ConnectionBar)

function PendingConnection() {
  return (
    <div className="grid [grid-template-areas:'stack'] [&>*]:stroke-orange-400 [&>*]:[grid-area:stack]">
      <Wifi style={{ animation: "fadeInOut 2000ms linear 750ms infinite" }} />
      <WifiHigh
        style={{ animation: "fadeInOut 2000ms linear 500ms infinite" }}
      />
      <WifiLow
        style={{ animation: "fadeInOut 2000ms linear 250ms infinite" }}
      />
      <WifiZero />
    </div>
  )
}
