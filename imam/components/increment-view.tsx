"use client"

 import { useEffect } from "react" /** * Fires a POST request once (on mount) to increment views. * This keeps public pages cacheable (no server-side mutations). */ export 
function IncrementView({ endpoint }: { endpoint: string }) {
 useEffect(() => { if (!endpoint) 
  return fetch(endpoint, { method: "POST" }).catch(() => { // Ignore view count errors }) }, [endpoint]) 
  return null }
