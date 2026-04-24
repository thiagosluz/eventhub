"use client";

import type { ReactNode } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export type SortDirection = "asc" | "desc";

export interface SortState<TKey extends string = string> {
  key: TKey;
  direction: SortDirection;
}

export interface DataTableColumn<TRow, TKey extends string = string> {
  /** Identificador único da coluna; quando `sortable` for true é usado como sort key. */
  key: TKey;
  /** Cabeçalho; string ou node. */
  header: ReactNode;
  /** Renderização da célula. */
  cell: (row: TRow, index: number) => ReactNode;
  /** Torna a coluna ordenável (requer onSortChange). */
  sortable?: boolean;
  /** Alinhamento horizontal do conteúdo/cabeçalho. */
  align?: "left" | "center" | "right";
  /** Classe extra para o <th>. */
  headerClassName?: string;
  /** Classe extra para o <td>. */
  cellClassName?: string;
  /** Largura fixa (ex.: "120px", "20%") via style. */
  width?: string;
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Quantidade de páginas visíveis. Padrão: calcula automático. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DataTableProps<TRow, TKey extends string = string> {
  data: TRow[];
  columns: DataTableColumn<TRow, TKey>[];
  /** Função para gerar uma key única por linha. */
  rowKey: (row: TRow, index: number) => string | number;
  /** Habilita skeleton enquanto carregando. */
  isLoading?: boolean;
  /** Quantas linhas skeleton renderizar. Padrão: 5. */
  loadingRows?: number;
  /** Mensagens para empty state. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  /** Callback ao clicar em uma linha. */
  onRowClick?: (row: TRow, index: number) => void;
  /** Estado de ordenação (controlado). */
  sort?: SortState<TKey>;
  onSortChange?: (sort: SortState<TKey>) => void;
  /** Paginação opcional. */
  pagination?: DataTablePagination;
  /** Classe extra no wrapper. */
  className?: string;
  /** Classe extra no <table>. */
  tableClassName?: string;
  /** aria-label descritivo do conteúdo da tabela. */
  ariaLabel?: string;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function toggleDirection(current?: SortDirection): SortDirection {
  return current === "asc" ? "desc" : "asc";
}

function SortIcon({ direction }: { direction?: SortDirection }) {
  if (direction === "asc") return <ChevronUpIcon className="h-3.5 w-3.5" aria-hidden="true" />;
  if (direction === "desc") return <ChevronDownIcon className="h-3.5 w-3.5" aria-hidden="true" />;
  return <ChevronUpDownIcon className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />;
}

export function DataTable<TRow, TKey extends string = string>({
  data,
  columns,
  rowKey,
  isLoading = false,
  loadingRows = 5,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription,
  emptyIcon,
  emptyAction,
  onRowClick,
  sort,
  onSortChange,
  pagination,
  className,
  tableClassName,
  ariaLabel,
}: DataTableProps<TRow, TKey>) {
  const showEmpty = !isLoading && data.length === 0;

  const handleSort = (col: DataTableColumn<TRow, TKey>) => {
    if (!col.sortable || !onSortChange) return;
    const nextDirection: SortDirection =
      sort?.key === col.key ? toggleDirection(sort.direction) : "asc";
    onSortChange({ key: col.key, direction: nextDirection });
  };

  return (
    <div
      className={cn(
        "premium-card bg-card border border-border overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table
          className={cn("w-full text-left border-collapse", tableClassName)}
          aria-label={ariaLabel}
          aria-busy={isLoading || undefined}
        >
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const ariaSort = col.sortable
                  ? isSorted
                    ? sort?.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest",
                      alignClass[col.align ?? "left"],
                      col.sortable && "cursor-pointer select-none",
                      col.headerClassName,
                    )}
                    onClick={col.sortable ? () => handleSort(col) : undefined}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSort(col);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5",
                          alignClass[col.align ?? "left"] === "text-right" && "w-full justify-end",
                          alignClass[col.align ?? "left"] === "text-center" && "w-full justify-center",
                          "hover:text-foreground transition-colors",
                        )}
                      >
                        <span>{col.header}</span>
                        <SortIcon direction={isSorted ? sort?.direction : undefined} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading &&
              Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col, j) => (
                    <td
                      key={`skeleton-${i}-${j}`}
                      className={cn("px-6 py-5", alignClass[col.align ?? "left"])}
                    >
                      <Skeleton className="h-4 w-full max-w-[140px]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading &&
              data.map((row, index) => {
                const key = rowKey(row, index);
                const isClickable = Boolean(onRowClick);
                return (
                  <tr
                    key={key}
                    className={cn(
                      "transition-colors",
                      isClickable && "cursor-pointer hover:bg-muted/30",
                      !isClickable && "hover:bg-muted/20",
                    )}
                    onClick={isClickable ? () => onRowClick?.(row, index) : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-6 py-5 text-sm text-foreground",
                          alignClass[col.align ?? "left"],
                          col.cellClassName,
                        )}
                      >
                        {col.cell(row, index)}
                      </td>
                    ))}
                  </tr>
                );
              })}

            {showEmpty && (
              <tr>
                <td colSpan={columns.length} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={emptyIcon}
                    action={emptyAction}
                    className="rounded-none border-0 bg-transparent"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && <DataTablePaginationBar pagination={pagination} />}
    </div>
  );
}

function DataTablePaginationBar({
  pagination,
}: {
  pagination: DataTablePagination;
}) {
  const { page, pageSize, total, onPageChange, pageSizeOptions, onPageSizeChange } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 bg-muted/20">
      <p className="text-xs font-semibold text-muted-foreground">
        {total === 0 ? (
          "0 resultados"
        ) : (
          <>
            Mostrando <span className="text-foreground">{from}</span> –{" "}
            <span className="text-foreground">{to}</span> de{" "}
            <span className="text-foreground">{total}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        {pageSizeOptions && onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span>Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="inline-flex items-center gap-1" role="group" aria-label="Paginação">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Página anterior"
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="px-3 text-xs font-bold text-foreground">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Próxima página"
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

DataTable.displayName = "DataTable";
