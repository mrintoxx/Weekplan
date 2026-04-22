export type LayoutItem = {
  id: string;
  start: string;
  end: string;
  isEvent?: boolean;
};

export type LayoutResult = {
  id: string;
  column: number;
  totalColumns: number;
};

function overlaps(a: LayoutItem, b: LayoutItem): boolean {
  return new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
}

export function computeLayout(items: LayoutItem[]): LayoutResult[] {
  if (items.length === 0) return [];

  const n = items.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    let x = i;
    while (parent[x] !== x) {
      const p = parent[x];
      if (p === undefined) break;
      parent[x] = p;
      x = p;
    }
    return x;
  }

  function union(i: number, j: number): void {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = items[i];
      const b = items[j];
      if (a !== undefined && b !== undefined && overlaps(a, b)) {
        union(i, j);
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const existing = groups.get(root);
    if (existing !== undefined) {
      existing.push(i);
    } else {
      groups.set(root, [i]);
    }
  }

  const columnMap = new Map<string, number>();
  const totalColumnsMap = new Map<string, number>();

  for (const indices of groups.values()) {
    const sorted = [...indices].sort((ai, bi) => {
      const a = items[ai];
      const b = items[bi];
      if (a === undefined || b === undefined) return 0;
      const aIsEvent = a.isEvent === true;
      const bIsEvent = b.isEvent === true;
      if (aIsEvent && !bIsEvent) return -1;
      if (!aIsEvent && bIsEvent) return 1;
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

    // columnOccupants[col] = list of LayoutItem indices already placed in that column
    const columnOccupants: [number[], number[], number[]] = [[], [], []];
    const assignedColumns: number[] = new Array(sorted.length).fill(0);

    for (let si = 0; si < sorted.length; si++) {
      const idx = sorted[si];
      if (idx === undefined) continue;
      const current = items[idx];
      if (current === undefined) continue;

      let assigned = false;
      for (let col = 0; col < 3; col++) {
        const occupants = columnOccupants[col];
        if (occupants === undefined) continue;
        let fits = true;
        for (const occupantIdx of occupants) {
          const occupant = items[occupantIdx];
          if (occupant === undefined) continue;
          if (overlaps(current, occupant)) {
            fits = false;
            break;
          }
        }
        if (fits) {
          assignedColumns[si] = col + 1;
          occupants.push(idx);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        throw new Error('Max 3 colonnes dépassé');
      }
    }

    const usedCols = new Set(assignedColumns);
    const totalColumns = usedCols.size;

    for (let si = 0; si < sorted.length; si++) {
      const idx = sorted[si];
      if (idx === undefined) continue;
      const itm = items[idx];
      if (itm === undefined) continue;
      const col = assignedColumns[si];
      if (col === undefined) continue;
      columnMap.set(itm.id, col);
      totalColumnsMap.set(itm.id, totalColumns);
    }
  }

  return items.map((item) => ({
    id: item.id,
    column: columnMap.get(item.id) ?? 1,
    totalColumns: totalColumnsMap.get(item.id) ?? 1,
  }));
}
