"use server"

import { revalidatePath } from "next/cache"

export async function revalidateNavbar() {
  revalidatePath("/", "layout")
}

export async function revalidateAll() {
  revalidatePath("/", "layout")
}
