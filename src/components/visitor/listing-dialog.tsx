"use client";
import { useId, useRef, type ReactNode } from "react";
import { X, ArrowUpLeft } from "lucide-react";

export default function ListingDialog({ title, children }: { title: string; children: ReactNode }) {
    const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null), id = useId();
    return <><button ref={trigger} className="card-explore" type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">اكتشف المزيد <ArrowUpLeft size={17} aria-hidden="true"/></button>
      <dialog ref={dialog} className="listing-dialog" aria-labelledby={id} onClose={() => trigger.current?.focus()} onClick={event => { if(event.target === dialog.current) dialog.current.close(); }}>
       <div className="detail-content"><button autoFocus type="button" className="dialog-close" aria-label="إغلاق التفاصيل" onClick={() => dialog.current?.close()}><X size={21}/></button><h2 id={id} className="sr-only">{title}</h2>{children}</div>
      </dialog></>;
}
