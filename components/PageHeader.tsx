export function PageHeader({ eyebrow, title, text, actions }: { eyebrow:string; title:string; text?:string; actions?:React.ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{text && <p className="muted">{text}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}
