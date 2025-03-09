export const ws = new WebSocket("ws://192.168.10.132:8000")
ws.onopen = () => console.log("WebSocket Connected")
ws.onclose = () => console.log("WebSocket Disconnected")

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