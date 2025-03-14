import throttle from "lodash.throttle"
import { MessageProps } from "./kanban/types"
import { ws } from "./kanban/use-broadcast"

// export const ws = new WebSocket("ws://192.168.10.132:8000")

const reportError = throttle(
  () => console.warn("Message not sent, not connected to websocket."),
  30000,
  {
    trailing: false
  },
)

export function msg(data: MessageProps['message']) {
  if (ws === null) return
  if (ws && ws?.readyState !== 1) {
    reportError()
    return
  } else {
    try {
      const msg = JSON.stringify(data)
      ws.send(msg)
    } catch (e) {
      console.log("Websocket request failed:", e)
    }
  }
}

/* ws.onmessage = (e) => {
  const { x, y, deactivate, id } = JSON.parse(e.data)
  const mouse = document.getElementById("mouse")
  if (mouse) {
    mouse.classList.remove("hidden")
    mouse.style.left = `${x}px`
    mouse.style.top = `${y}px`
    if (deactivate) {
      mouse.classList.add("hidden")
    }
  }
  const el = document.getElementById(`${id}`)
  if (!el) return
  const rect = el.getBoundingClientRect()

  if (deactivate) {
    return el.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        pointerType: "mouse",
        isPrimary: true,
      })
    )
  }

  el.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      pointerType: "mouse",
      isPrimary: true,
    })
  )

  el.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
      clientX: x,
      clientY: y,
      isPrimary: true,
    })
  )
} */
