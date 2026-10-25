import type {Analysis} from "./types";
const escapeText=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
export function calendarContent(a:Analysis) {
 const dates=[...(a.deadline?[{title:"Final notice deadline",dueDate:a.deadline}]:[]),...a.items.filter(x=>x.dueDate).map(x=>({title:x.title,dueDate:x.dueDate!}))];
 if(!dates.length)return "";
 const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//PaperCue AI//EN",...dates.flatMap((d,i)=>{const next=new Date(d.dueDate+"T00:00:00Z");next.setUTCDate(next.getUTCDate()+1);return ["BEGIN:VEVENT","UID:papercue-"+i+"-"+d.dueDate+"@papercue.local","DTSTAMP:"+stamp,"DTSTART;VALUE=DATE:"+d.dueDate.replace(/-/g,""),"DTEND;VALUE=DATE:"+next.toISOString().slice(0,10).replace(/-/g,""),"SUMMARY:"+escapeText(d.title),"DESCRIPTION:Verify the original notice before taking action.","END:VEVENT"];}),"END:VCALENDAR"].join("\r\n")+"\r\n";
}
