"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { LENSES, MAX_CELL, MIN_CELL, type Lens, type MapStrings, type Order } from "./map-types";

// The lens, the order of the suras and the zoom.
export function MapControls({
  lens,
  setLens,
  order,
  setOrder,
  cellSize,
  setCell,
  m,
}: {
  lens: Lens;
  setLens: (lens: Lens) => void;
  order: Order;
  setOrder: (order: Order) => void;
  cellSize: number | null;
  setCell: (cell: number) => void;
  m: MapStrings["map"];
}) {
  return (
    <>
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">{m.lens}</span>
      <RadioGroup
        value={lens}
        onValueChange={(value) => setLens(value as Lens)}
        className="flex flex-wrap gap-x-5 gap-y-2"
        aria-label={m.lens}
      >
        {LENSES.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <RadioGroupItem value={key} id={`lens-${key}`} />
            <Label htmlFor={`lens-${key}`} className="font-normal">
              {m.lenses[key]}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{m.upcoming}</summary>
        <ul className="mt-1 ms-5 list-disc">
          {m.upcomingLenses.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </details>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Label htmlFor="map-order" className="font-normal">
          {m.order}
        </Label>
        <Select value={order} onValueChange={(value) => setOrder(value as Order)}>
          <SelectTrigger id="map-order" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mushaf">{m.orders.mushaf}</SelectItem>
            <SelectItem value="revelation">{m.orders.revelation}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={m.zoomOut}
          title={m.zoomOut}
          disabled={!cellSize || cellSize <= MIN_CELL}
          onClick={() => setCell(Math.max(MIN_CELL, (cellSize ?? MIN_CELL) - 1))}
        >
          <ZoomOut />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={m.zoomIn}
          title={m.zoomIn}
          disabled={!!cellSize && cellSize >= MAX_CELL}
          onClick={() => setCell(Math.min(MAX_CELL, (cellSize ?? MIN_CELL) + 1))}
        >
          <ZoomIn />
        </Button>
      </div>
    </div>
    </>
  );
}
