"use server"

export async function getData() {
  return new Promise((resolve) => setTimeout(() => resolve("yay"), 1000))
}
