const lessons = [ { id: 1, title: "أحكام الزكاة في الأموال المعاصرة", category: "فقه", date: "منذ يومين", }, { id: 2, title: "تأملات في سورة الكهف - الدرس الرابع", category: "تفسير", date: "منذ 5 أيام", }, { id: 3, title: "غزوة بدر الكبرى والدروس المستفادة", category: "سيرة", date: "منذ أسبوع", }, ] export 
function RecentLessons() {
 
  return ( <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
<div className="p-6 border-b border-border flex justify-between items-center">
 <h3 className="font-bold text-lg flex items-center gap-2">
<span className="w-1 h-6 bg-secondary rounded-full">
</span>

 أحدث الدروس الصوتية </h3>
<a href="/admin/lessons" className="text-sm text-primary font-medium hover:underline">
 عرض الكل </a>
</div>

 <div className="divide-y divide-border">
 {lessons.map((lesson) => ( <div key={lesson.id} className="p-4 hover:bg-background transition-colors flex items-center justify-between group" >
<div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-colors">
<span className="material-icons-outlined">
play_arrow</span>
</div>

 <div>
<h4 className="font-bold text-sm text-foreground">
{lesson.title}</h4>
<div className="flex items-center gap-3 mt-1">
 <span className="text-xs bg-background px-2 py-0.5 rounded text-text-muted">
 {lesson.category} </span>
<span className="text-xs text-text-muted">
{lesson.date}</span>
</div>

 </div>
</div>

 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
<button className="p-2 text-text-muted hover:text-primary">
 <span className="material-icons-outlined">
edit</span>
</button>

 <button className="p-2 text-text-muted hover:text-red-500">
<span className="material-icons-outlined">
delete</span>
</button>

 </div>
</div>

 ))} </div>
</div>

 ) }
