export interface TreemapItem {
  name: string
  path: string
  value: number
  type: 'file' | 'folder'
  extension?: string
  children?: TreemapItem[]
}

export interface TreemapRect {
  x: number
  y: number
  width: number
  height: number
  item: TreemapItem
}

function worstAspectRatio(row: TreemapItem[], side: number): number {
  const totalArea = row.reduce((sum, item) => sum + item.value, 0)
  const rowWidth = totalArea / side
  let worst = 0

  for (const item of row) {
    const itemHeight = item.value / rowWidth
    const aspect = Math.max(rowWidth / itemHeight, itemHeight / rowWidth)
    if (aspect > worst) worst = aspect
  }

  return worst
}

function squarify(
  items: TreemapItem[],
  rect: { x: number; y: number; width: number; height: number },
  results: TreemapRect[]
): void {
  if (items.length === 0) return
  if (items.length === 1) {
    results.push({ ...rect, item: items[0] })
    return
  }

  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  if (totalValue <= 0) return

  const side = Math.min(rect.width, rect.height)

  let row: TreemapItem[] = [items[0]]
  let remaining = items.slice(1)

  while (remaining.length > 0) {
    const candidate = [...row, remaining[0]]
    if (worstAspectRatio(candidate, side) <= worstAspectRatio(row, side)) {
      row.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      break
    }
  }

  const rowArea = row.reduce((sum, item) => sum + item.value, 0)
  const rowFraction = rowArea / totalValue

  let rowRect: { x: number; y: number; width: number; height: number }
  let remainingRect: { x: number; y: number; width: number; height: number }

  if (rect.width >= rect.height) {
    const rowWidth = rect.width * rowFraction
    rowRect = { x: rect.x, y: rect.y, width: rowWidth, height: rect.height }
    remainingRect = { x: rect.x + rowWidth, y: rect.y, width: rect.width - rowWidth, height: rect.height }
  } else {
    const rowHeight = rect.height * rowFraction
    rowRect = { x: rect.x, y: rect.y, width: rect.width, height: rowHeight }
    remainingRect = { x: rect.x, y: rect.y + rowHeight, width: rect.width, height: rect.height - rowHeight }
  }

  let offset = 0
  for (const item of row) {
    const fraction = item.value / rowArea
    if (rect.width >= rect.height) {
      const h = rowRect.height * fraction
      results.push({
        x: rowRect.x,
        y: rowRect.y + offset,
        width: rowRect.width,
        height: h,
        item,
      })
      offset += h
    } else {
      const w = rowRect.width * fraction
      results.push({
        x: rowRect.x + offset,
        y: rowRect.y,
        width: w,
        height: rowRect.height,
        item,
      })
      offset += w
    }
  }

  squarify(remaining, remainingRect, results)
}

export function computeTreemap(
  items: TreemapItem[],
  width: number,
  height: number
): TreemapRect[] {
  const results: TreemapRect[] = []

  const sorted = [...items]
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  squarify(sorted, { x: 0, y: 0, width, height }, results)
  return results
}
