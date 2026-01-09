"use client"

 import { Switch } from "@/components/ui/switch"
import { Pencil, Trash2, Eye } from "lucide-react" interface MediaItem { id: string title: string description: string media_type: string media_source: string media_path_or_url: string thumbnail_path?: string publish_status: string is_active: boolean views_count: number created_at: string }

interface VideoFormRowProps { item: MediaItem onEdit: (item: MediaItem) => void onDelete: (id: string) => void onToggleActive: (id: string, currentStatus: boolean) => void }

export function VideoFormRow({ item, onEdit, onDelete, onToggleActive }: VideoFormRowProps) {
 
  return ( <tr className="hover:bg-muted/50 transition-colors">
<td className="px-6 py-5">
 <div className="flex items-center gap-3">
 {item.thumbnail_path ? ( <img src={item.thumbnail_path || "/placeholder.svg"}
alt = "" className="w-16 h-10 rounded-lg object-cover" />
 ) : ( <div className="w-16 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
<span className="material-icons-outlined text-primary">
videocam</span>
</div>

 )} <div>
<p className="font-bold text-foreground">
{item.title}</p>
<p className="text-xs text-text-muted mt-1">
{new Date(item.created_at).toLocaleDateString("ar-EG")}</p>
</div>

 </div>
</td>

 <td className="px-6 py-5">
<span className={`text-xs px-3 py-1 rounded-full font-bold ${ item.media_source === "youtube" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600" }`} >
 {item.media_source === "youtube" ? "يوتيوب" : "محلي"} </span>
</td>

 <td className="px-6 py-5">
<span className={`px-3 py-1 rounded-full text-xs font-bold ${ item.publish_status === "published" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600" }`} >
 {item.publish_status === "published" ? "منشور" : "مسودة"} </span>
</td>

 <td className="px-6 py-5">
<Switch checked={item.is_active ?? true}
onCheckedChange = {() =>
 onToggleActive(item.id, item.is_active ?? true)} /> </td>
<td className="px-6 py-5">
 <div className="flex items-center gap-2">
<button onClick={() =>
 window.open(`/videos/${item.id}`, "_blank")}
className="p-2 rounded-lg hover:bg-muted text-text-muted hover:text-foreground transition-colors" title="عرض" > <Eye className="h-5 w-5" />
</button>
<button onClick={() =>
 onEdit(item)}
className="p-2 rounded-lg hover:bg-muted text-blue-600 transition-colors" title="تعديل" > <Pencil className="h-5 w-5" />
</button>
<button onClick={() =>
 onDelete(item.id)}
className="p-2 rounded-lg hover:bg-muted text-red-600 transition-colors" title="حذف" > <Trash2 className="h-5 w-5" />
</button>
</div>
</td>
</tr>

 ) }
