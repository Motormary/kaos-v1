import { cn } from "@/lib/utils"
import {
  CircleCheck,
  CirclePause,
  CircleX,
  ScreenShare,
  ScreenShareOff,
  Users,
} from "lucide-react"
import { Button } from "../ui/button"
import { memo } from "react"

type connectionProps = {
  connectionStatus: string
  users: string[]
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
        <div className="text-muted-foreground mb-5 flex items-center gap-2 font-semibold">
          {connectionStatus === "pending" ? (
            <>
              <CirclePause className={cn("size-5 fill-orange-400")} />
              <span>Connecting...</span>
            </>
          ) : null}
          {connectionStatus === "connected" ? (
            <>
              <CircleCheck className={cn("size-5 fill-green-400")} />
              <span>Connected</span>
            </>
          ) : null}
          {connectionStatus === "closing" ? (
            <>
              <CirclePause className={cn("size-5 fill-orange-400")} />
              <span>Disconnecting...</span>
            </>
          ) : null}
          {connectionStatus === "disconnected" ? (
            <>
              <CircleX className={cn("size-5 fill-red-400")} />
              <span>Disconnected</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(ConnectionBar)
