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

type connectionProps = {
  connectionStatus: string
  connectOperator: () => void
  disconnectOperator: () => void
  users: string[]
}

export default function ConnectionBar({
  connectionStatus,
  connectOperator,
  disconnectOperator,
  users,
}: connectionProps) {
  return (
    <div className="flex w-full items-baseline justify-between gap-4">
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
      <div className="flex justify-end gap-4">
        <div className="flex w-fit gap-1 truncate text-white">
          <Users />
          {users?.length ? users.length + 1 : 1}
        </div>
        <div className="mb-5 flex items-center gap-2 text-lg font-semibold text-white">
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
