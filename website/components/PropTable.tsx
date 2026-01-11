import { cn } from "@/lib/utils"
import { Fragment } from "react"

type Prop = {
  name: string
  type: string
  default?: string
  description: string
}

type PropTableProps = {
  items: Prop[]
}

const cellPadding = "px-3 py-2"

export function PropTable({ items }: PropTableProps) {
  return (
    <div data-type="table" className="mt-6 w-full overflow-x-auto rounded-lg border border-border -webkit-overflow-scrolling-touch">
      <table className="min-w-[600px] w-full md:table-fixed md:min-w-full">
        <thead className="border-border border-b bg-grey text-left font-default text-default">
          <tr>
            <th className={cn(cellPadding, "md:w-[200px] font-normal text-small text-xs min-w-[140px]")}>Property</th>
            <th className={cn(cellPadding, "font-normal text-small text-xs")}>Type</th>
            <th className={cn(cellPadding, "md:w-[170px] font-normal text-small text-xs min-w-[120px]")}>Default</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <Fragment key={item.name}>
              <tr className="w-full text-left font-default text-default">
                <td className={cn(cellPadding, "font-mono text-fd-primary break-words")}><code className="break-words whitespace-normal">{item.name}</code></td>
                <td className={cn(cellPadding, "font-mono text-fd-muted-foreground break-words")}><code className="break-words whitespace-normal">{item.type}</code></td>
                <td className={cn(cellPadding, "font-mono text-fd-muted-foreground break-words", {'text-text-muted': !item.default})}>
                  {item.default ? <code className="break-words whitespace-normal">{item.default}</code> : '-'}
                </td>
              </tr>
              <tr className={cn("w-full text-left", index < items.length - 1 && "border-b")}>
                <td colSpan={3} className={cn(cellPadding, "font-normal text-small text-sm pt-0")}>
                  <div className="flex items-center">
                    <span className="break-words">{item.description}</span>
                  </div>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
