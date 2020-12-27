import { createState } from "solid-js"
import "./SimpleTable.less"
import { Props, State, SortDirection, Row, Column, Key } from "./SimpleTable.types"

export type { AnyObject, Renderable, Key, Row, Column, SortDirection, Props, State } from "./SimpleTable.types"

export function SimpleTable(props: Props) {
  const [state, setState] = createState<State>({})

  function getSortDirection(): SortDirection {
    if (state.sortDirection !== undefined) {
      return state.sortDirection
    } else if (props.initialSortDirection !== undefined) {
      const sortDirection = new Map([props.initialSortDirection])
      setState({ sortDirection, sortedColumnKey: props.initialSortDirection[0] })
      return sortDirection
    } else {
      return new Map()
    }
  }

  function getSorter(): NonNullable<Props["rowSorter"]> {
    return props.rowSorter ?? defaultSorter
  }

  function generateSortCallback(columnKey: string) {
    return (e: MouseEvent) => {
      const sortDirection = getSortDirection()
      sortClickHandler(sortDirection, columnKey, /* append */ e.shiftKey)
      setState({ sortDirection, sortedColumnKey: columnKey })
    }
  }

  const { headerRenderer = defaultHeaderRenderer, bodyRenderer = defaultBodyRenderer, rowKey = defaultRowKey } = props

  const sortDirection = getSortDirection()
  // sort rows
  if (sortDirection.size !== 0 && state.sortedColumnKey !== undefined) {
    props.rows = getSorter()(props.rows, state.sortedColumnKey, sortDirection)
  }

  if (props.columns === undefined) {
    props.columns = defaultColumnMaker(props.rows)
  }

  return (
    <table className={`solid-simple-table ${props.className ?? ""}`} style={props.style}>
      <thead>
        <tr>
          {props.columns.map((column) => (
            <th
              key={column.key}
              className={column.sortable !== false ? "sortable" : undefined}
              onClick={column.sortable !== false ? generateSortCallback(column.key) : undefined}
            >
              {headerRenderer(column)} {column.sortable !== false && renderHeaderIcon(getSortDirection(), column.key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {props.rows.map(function (row) {
          const key = rowKey(row)
          return (
            <tr key={key}>
              {props.columns!.map(function (column) {
                const givenOnClick = column.onClick
                const onClick =
                  givenOnClick &&
                  function (e: MouseEvent) {
                    givenOnClick(e, row)
                  }

                return (
                  <td onClick={onClick} key={`${key}.${column.key}`}>
                    {bodyRenderer(row, column.key)}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const ARROW = {
  UP: "↑",
  DOWN: "↓",
  BOTH: "⇅",
}

function defaultColumnMaker(rows: Array<Row>, representitiveRowNumber: number = 0) {
  // construct the column information based on the representitive row
  const representitiveRow = rows[representitiveRowNumber]
  const columnKeys = Object.keys(representitiveRow)

  // make Array<{key: columnKey}>
  const columnNumber = columnKeys.length
  let columns: Array<Column> = new Array(columnNumber)
  for (let iCol = 0; iCol < columnNumber; iCol++) {
    columns[iCol] = { key: columnKeys[iCol] }
  }
  return columns
}

// Returns a string from any value
function stringer(value: any) {
  if (typeof value === "string") {
    return value
  } else {
    return JSON.stringify(value)
  }
}

function defaultHeaderRenderer(column: Column) {
  return column.label ?? column.key
}

function defaultBodyRenderer(row: Row, columnKey: Key) {
  return stringer(row[columnKey])
}

function defaultRowKey(row: Row) {
  return JSON.stringify(row)
}

function renderHeaderIcon(sortDirection: SortDirection, columnKey: string) {
  let icon
  if (sortDirection.has(columnKey)) {
    icon = sortDirection.get(columnKey) === "asc" ? ARROW.UP : ARROW.DOWN
  } else {
    icon = ARROW.BOTH
  }
  return <span className="sort-icon">{icon}</span>
}

function sortClickHandler(sortDirection: SortDirection, columnKey: Key, append: boolean) {
  // reset sorting if shiftKey is hold
  if (append) {
    sortDirection.clear()
    return
  }
  if (!sortDirection.has(columnKey)) {
    // default to asc if key not found
    sortDirection.set(columnKey, "asc")
  } else {
    // invert direction on click
    let type = sortDirection.get(columnKey)
    type = type === "asc" ? "desc" : "asc" // invert direction
    sortDirection.set(columnKey, type)
  }
}

/**
 Default alphabetical sort function
 @param rows: the rows of the table
 @param columnKey: the last clicked columnKey
*/
function defaultSorter(rows: Array<Row>, columnKey: Key, sortInfo: SortDirection): Array<Row> {
  let isDesc: boolean = false // by default sort asc
  if (sortInfo.has(columnKey)) {
    const sortDirection = sortInfo.get(columnKey)
    isDesc = sortDirection == "desc"
  }
  rows = rows.sort(function (r1, r2) {
    const r1_val = r1[columnKey]
    const r2_val = r2[columnKey]
    if (r1_val == r2_val) {
      // equal values
      return 0
    } else if (r1_val < r2_val) {
      return -1; //r1_val comes first
    } else {
      return 1; // r2_val comes first
    }
  })
  return isDesc ? rows.reverse() : rows
}
