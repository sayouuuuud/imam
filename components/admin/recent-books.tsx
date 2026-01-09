const books = [ { id: 1, title: "فقه السنة - دراسة منهجية", shortTitle: "فقه السنة", downloads: 410, }, { id: 2, title: "زاد المسلم اليومي", shortTitle: "زاد المسلم", downloads: 180, }, ] export 
function RecentBooks() {
 
  return ( <div className="bg-surface rounded-2xl shadow-sm border border-border p-6">
<div className="flex justify-between items-center mb-6">
 <h3 className="font-bold text-lg">
أحدث الكتب</h3>
<button className="text-xs bg-primary/10 text-primary p-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
 <span className="material-icons-outlined text-sm">
add</span>
</button>

 </div>
<div className="space-y-4">
 {books.map((book, index) => ( <div key={book.id} className={`flex gap-4 items-start ${index >
 0 ? "pt-4 border-t border-border" : ""}`} > <div className="w-16 h-20 bg-primary rounded shadow-md flex items-center justify-center text-white/50 text-xs text-center p-1">
<span className="font-serif">
{book.shortTitle}</span>
</div>

 <div className="flex-1">
<h4 className="font-bold text-sm text-foreground">
{book.title}</h4>
<p className="text-xs text-text-muted mt-1 mb-2">
عدد التحميلات: {book.downloads}</p>
<a href="#" className="text-xs text-primary font-medium flex items-center gap-1">
 <span className="material-icons-outlined text-[14px]">
edit</span>

 تعديل </a>
</div>

 </div>

 ))} </div>
</div>

 ) }
