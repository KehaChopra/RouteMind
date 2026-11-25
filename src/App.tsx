import { FormEvent, useEffect, useState } from "react"
import {
  createDriver,
  createOrder,
  createTrackingLink,
  createVehicle,
  generatePlan,
  getAnalytics,
  getCustomerTracking,
  getLatestPlan,
  listFleet,
  listOrders,
  listPlans,
  recordDeliveryEvent,
  type DeliveryUpdate,
  type CustomerTrackingStatus,
  type DriverDraft,
  type OrderDraft,
  type RoutePlan,
  type PlannerStrategy,
  type TravelMode,
  type VehicleDraft,
} from "./api"
import { comparePlans } from "./reporting"
import {
  Driver,
  Order,
  Vehicle,
} from "./data"

type Page = "overview" | "planner" | "orders" | "fleet" | "tracking" | "analytics" | "history" | "customer"

type IconName = "analytics" | "bell" | "calendar" | "check" | "chevron" | "clock" | "close" | "download" | "edit" | "fleet" | "history" | "info" | "locate" | "map" | "menu" | "minus" | "orders" | "overview" | "plus" | "route" | "save" | "search" | "settings" | "spark" | "tracking" | "truck" | "user" | "warning"

const paths: Record<IconName, React.ReactNode> = {
  analytics: (
    <>
      <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
      <path d="m13.5 7 3.5 3.5" />
    </>
  ),
  fleet: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="7" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  menu: <path d="M5 7h14M5 12h14M5 17h14" />,
  minus: <path d="M5 12h14" />,
  orders: (
    <>
      <path d="M6 4h12v17H6zM9 4V2h6v2M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h3a3 3 0 0 0 3-3v-1a3 3 0 0 0-3-3H9a3 3 0 0 1-3-3V6M16 6h-3" />
    </>
  ),
  save: (
    <>
      <path d="M4 4h14l2 2v14H4zM8 4v6h8V4M8 20v-6h8v6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1A7 7 0 0 0 15 6l-.4-2.7h-4L10 6a7 7 0 0 0-1.5.9l-2.5-1-2 3.5L6 11a7 7 0 0 0 0 2l-2 1.6L6 18l2.5-1A7 7 0 0 0 10 18l.5 2.7h4L15 18a7 7 0 0 0 1.5-.9l2.5 1 2-3.5-2-1.6a7 7 0 0 0 .1-1Z" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
      <path d="m5 13 .8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Z" />
    </>
  ),
  tracking: (
    <>
      <circle cx="12" cy="10" r="3" />
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    </>
  ),
  truck: (
    <>
      <path d="M3 5h11v11H3zM14 9h4l3 3v4h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-5 3-8 8-8s8 3 8 8" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.7 2.6 18a2 2 0 0 0 1.8 3h15.2a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
}

function Icon({ name, size = 18 }: { name: IconName, size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  ariaLabel,
  children,
  variant = "secondary",
  onClick,
  type = "button",
  disabled = false,
}: {
  ariaLabel?: string
  children: React.ReactNode
  variant?: "primary" | "secondary" | "quiet" | "danger"
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  )
}

const pageTitles: Record<Page, string> = {
  overview: "Overview",
  planner: "Route Planner",
  orders: "Orders",
  fleet: "Drivers & Vehicles",
  tracking: "Live Tracking",
  analytics: "Analytics",
  history: "Optimization History",
  customer: "Delivery status",
}

const navGroups: {
  label: string
  items: { page: Page, label: string, icon: IconName }[]
}[] = [
  {
    label: "Workspace",
    items: [
      { page: "overview", label: "Overview", icon: "overview" },
      { page: "planner", label: "Route Planner", icon: "route" },
      { page: "orders", label: "Orders", icon: "orders" },
      { page: "fleet", label: "Drivers & Vehicles", icon: "fleet" },
      { page: "tracking", label: "Live Tracking", icon: "tracking" },
      { page: "analytics", label: "Analytics", icon: "analytics" },
    ],
  },
  {
    label: "Management",
    items: [
      { page: "history", label: "Optimization History", icon: "history" },

    ],
  },
]

function Brand() {
  return (
    <div className="brand">
      <svg fill="none" viewBox="0 0 38 38">
        <path d="M9 28c0-6 9-4 9-10 0-4-5-4-5-8" />
        <circle cx="9" cy="29" r="3" />
        <path d="M27 8c-4.4 0-8 3.4-8 7.7 0 5.7 8 13.3 8 13.3s8-7.6 8-13.3C35 11.4 31.4 8 27 8Z" />
        <circle cx="27" cy="15.5" r="2.5" />
      </svg>
      <span>RouteMind</span>
    </div>
  )
}

function Status({ value }: { value: string }) {
  return (
    <span
      className={`status status-${value.toLowerCase().replace(/ /g, "-")}`}
    >
      <i />
      {value}
    </span>
  )
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">Operations workspace</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

function Drawer({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            aria-label="Close details"
            className="icon-btn"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overlay modal-overlay" onMouseDown={onClose}>
      <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            aria-label="Close form"
            className="icon-btn"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function OverviewPage({ date, setDate, orders, ordersLoading, ordersError, goTo }: ReportDate & {
  orders: Order[]
  ordersLoading: boolean
  ordersError: string
  goTo: (page: Page) => void
}) {
  const { data: plan, loading, error, retry } = useDatedReport(date, getLatestPlan)
  const datedOrders = orders.filter((order) => order.date === date)
  const completed = datedOrders.filter((order) => order.status === "Delivered").length
  return (
    <div className="page">
      <PageHeader title="Overview" subtitle="Orders and the latest route plan for your selected date."
        actions={<ReportDatePicker date={date} setDate={setDate} />} />
      {(loading || ordersLoading) && <p role="status">Loading overview…</p>}
      {error && <div><p role="alert">{error}</p><Button onClick={retry}>Retry plan</Button></div>}
      {ordersError && <p role="alert">{ordersError}</p>}
      {!loading && !ordersLoading && (
        <div className="analytic-metrics">
          <div><span>Orders</span><strong>{ordersError ? "—" : datedOrders.length}</strong></div>
          <div><span>Completed</span><strong>{ordersError ? "—" : completed}</strong></div>
          <div><span>Planned routes</span><strong>{plan?.routes.length ?? (error ? "—" : 0)}</strong></div>
          <div><span>Unassigned in latest plan</span><strong>{plan?.unassigned.length ?? "—"}</strong></div>
        </div>
      )}
      <section className="panel">
        <div className="panel-head">
          <div><h2>Delivery plan</h2><p>{plan ? `Saved plan #${plan.id}` : "Create a plan when orders and vehicles are ready."}</p></div>
          <Button onClick={() => goTo("planner")}>Open Route Planner</Button>
        </div>
        {plan?.routes.length ? (
          <DataTable headers={["Vehicle", "Driver", "Completed", "Stops"]} rows={plan.routes.map((route) => [
            route.vehicleId, route.driverName, route.stops.filter((stop) => stop.completedAt).length, route.stops.length,
          ])} />
        ) : <p className="report-empty">No routes assigned for this date.</p>}
      </section>
    </div>
  )
}

function RoadAttribution() {
  return (
    <small className="road-attribution">
      © <a href="https://openrouteservice.org/">openrouteservice.org by HeiGIT</a>
      {" · "}Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>
    </small>
  )
}

function StopMap({ stops }: { stops: RoutePlan["routes"][number]["stops"] }) {
  const points = stops.filter((stop) => stop.coordinates)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("")
  const stop = points.find((item) => item.orderId === selected) ?? points[0]
  if (!stop?.coordinates) return null
  const [lon, lat] = stop.coordinates
  const bounds = [
    Math.max(-180, lon - .01), Math.max(-85, lat - .008),
    Math.min(180, lon + .01), Math.min(85, lat + .008),
  ]
  const map = new URL("https://www.openstreetmap.org/export/embed.html")
  map.search = new URLSearchParams({ bbox: bounds.join(","), layer: "mapnik", marker: `${lat},${lon}` }).toString()
  return (
    <div className="stop-map">
      <Button onClick={() => setOpen(!open)}>{open ? "Hide stop map" : "Show stop map"}</Button>
      {open && (
        <>
          <select className="select" aria-label="Stop on map" value={stop.orderId} onChange={(event) => setSelected(event.target.value)}>
            {points.map((item) => <option value={item.orderId} key={item.orderId}>{item.orderId} · {item.address}</option>)}
          </select>
          <iframe title={`Map for ${stop.orderId}`} src={map.href} loading="lazy" referrerPolicy="no-referrer" />
        </>
      )}
    </div>
  )
}

function PlannerPage({ date, setDate }: {
  date: string
  setDate: (date: string) => void
}) {
  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [strategy, setStrategy] = useState<PlannerStrategy>("greedy")
  const [travelMode, setTravelMode] = useState<Exclude<TravelMode, "demo">>("coordinates")
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(Boolean(date))
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState("")
  const route = plan?.routes.find((item) => item.vehicleId === selected) ?? plan?.routes[0]

  useEffect(() => {
    if (!date) return
    const controller = new AbortController()
    getLatestPlan(date, controller.signal)
      .then((saved) => {
        if (controller.signal.aborted) return
        setPlan(saved)
        if (saved) setStrategy(saved.method.startsWith("GNN") ? "graph" : "greedy")
        if (saved?.travelMode === "road" || saved?.travelMode === "coordinates") setTravelMode(saved.travelMode)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load the saved plan. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [date])

  const changeDate = (nextDate: string) => {
    if (nextDate === date) return
    setPlan(null)
    setSelected("")
    setError("")
    setLoading(Boolean(nextDate))
    setDate(nextDate)
  }

  const optimize = async () => {
    if (!date || optimizing || loading) return
    setOptimizing(true)
    setError("")
    try {
      setPlan(await generatePlan(date, strategy, travelMode))
      setSelected("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not generate a route plan.")
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="page planner-page">
      <PageHeader
        title="Route Planner"
        subtitle="Build delivery routes from saved orders and available driver–vehicle pairs."
        actions={
          <>
            <label className="date-control">
              <Icon name="calendar" size={16} />
              <input
                aria-label="Planning date"
                disabled={optimizing}
                onChange={(event) => changeDate(event.target.value)}
                type="date"
                value={date}
              />
            </label>
            <select aria-label="Travel estimates" className="select"
              disabled={loading || optimizing || Boolean(plan?.event)}
              onChange={(event) => setTravelMode(event.target.value === "road" ? "road" : "coordinates")}
              value={travelMode}>
              <option value="coordinates">Coordinate estimates</option>
              <option value="road">Road routing</option>
            </select>
            <select
              aria-label="Planning method"
              className="select"
              disabled={loading || optimizing || Boolean(plan?.event)}
              onChange={(event) => setStrategy(event.target.value === "graph" ? "graph" : "greedy")}
              value={strategy}
            >
              <option value="greedy">Greedy insertion</option>
              <option value="graph">GNN-assisted insertion</option>
            </select>
            <Button disabled={!date || loading || optimizing || Boolean(plan?.event)} onClick={optimize} variant="primary">
              <Icon name="spark" size={16} />
              {optimizing ? "Optimizing…" : "Optimize Routes"}
            </Button>
          </>
        }
      />
      <div className="planner-note">
        <span><Icon name="info" size={15} /> {travelMode === "road"
          ? "Road routing sends delivery addresses to openrouteservice."
          : "Coordinate planning estimates straight-line travel at 30 km/h."}</span>
        {plan && <strong>Saved plan #{plan.id} · {plan.travelSource}</strong>}
      </div>
      {plan?.travelMode === "road" && <RoadAttribution />}
      {plan?.event && <p>This plan is in progress. Use Live Tracking to update the remaining stops.</p>}
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">Loading saved plan…</p>}
      {optimizing && <p role="status">Calculating travel times and checking route constraints…</p>}
      {!plan && !loading && !optimizing && !error && (
        <p>{date ? "Select Optimize Routes to create the first plan for this date." : "Choose a planning date."}</p>
      )}
      {plan && (
        <>
          <div className="planner-results">
            <section className="panel route-inspector">
              <div className="panel-head">
                <div>
                  <h2>Planned routes</h2>
                  <p>{plan.orderCount - plan.unassigned.length} of {plan.orderCount} orders assigned</p>
                </div>
              </div>
              <div className="route-card-list">
                {plan.routes.length === 0 && <p>No routes generated for this date.</p>}
                {plan.routes.map((item) => (
                  <button
                    aria-pressed={route?.vehicleId === item.vehicleId}
                    className={`route-row ${route?.vehicleId === item.vehicleId ? "selected" : ""}`}
                    key={item.vehicleId}
                    onClick={() => setSelected(item.vehicleId)}
                  >
                    <div className="route-row-top">
                      <div>
                        <strong>{item.driverName}</strong>
                        <small>{item.vehicleId}</small>
                      </div>
                      <Icon name="chevron" size={16} />
                    </div>
                    <div className="route-row-stats">
                      <span>{item.stops.length} stops</span>
                      <span>{item.distanceKm} km</span>
                      <span>{item.loadKg} / {item.capacityKg} kg</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            {route && (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>Stop sequence</h2>
                    <p>{route.driverName} · {route.returnAt ? `Estimated depot return ${route.returnAt}` : "Depot return falls outside the shift"}</p>
                  </div>
                </div>
                <DataTable
                  headers={["Stop", "Order", "Delivery address", "ETA", "Delivery window", "Delivered at", "Load"]}
                  rows={route.stops.map((stop, index) => [
                    index + 1, stop.orderId, stop.address, stop.eta, stop.window, stop.completedAt ?? "—", `${stop.loadKg} kg`,
                  ])}
                />
                <StopMap key={route.vehicleId} stops={route.stops} />
              </section>
            )}
          </div>
          {plan.comparison && <PlanComparison comparison={plan.comparison} />}
          {plan.unassigned.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <div><h2>Unassigned orders ({plan.unassigned.length})</h2></div>
              </div>
              <DataTable
                headers={["Order", "Delivery address", "Reason"]}
                rows={plan.unassigned.map((order) => [order.orderId, order.address, order.reason])}
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}

function PlanComparison({ comparison }: { comparison: NonNullable<RoutePlan["comparison"]> }) {
  return (
    <section className="panel stop-panel">
      <div className="panel-head"><div><h2>Planner comparison</h2><p>Both methods used the same orders, fleet and travel times.</p></div></div>
      <DataTable headers={["Method", "Assigned orders", "Estimated distance"]} rows={comparison.map((result) => [
        result.method,
        result.assigned,
        result.assigned ? `${result.distanceKm} km` : "—",
      ])} />
    </section>
  )
}

function DataTable({
  headers,
  rows,
  onRow,
}: {
  headers: string[]
  rows: React.ReactNode[][]
  onRow?: (index: number) => void
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} onClick={() => onRow?.(ri)}>
              {row.map((cell, ci) => (
                <td key={ci}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrderDrawer({ order, onClose }: { order: Order, onClose: () => void }) {
  const [link, setLink] = useState("")
  const [linkError, setLinkError] = useState("")
  const [creating, setCreating] = useState(false)
  const share = async () => {
    setCreating(true)
    setLinkError("")
    try {
      const { token } = await createTrackingLink(order.id)
      setLink(`${location.origin}${location.pathname}#/customer/${token}`)
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Could not create the tracking link.")
    } finally {
      setCreating(false)
    }
  }
  return (
    <Drawer onClose={onClose} subtitle={order.customer} title={order.id}>
      <div className="drawer-status">
        <Status value={order.status} />
        <span>Delivery on {order.date}</span>
      </div>
      <DetailSection title="Customer & delivery">
        <Detail label="Customer" value={order.customer} />
        <Detail label="Address" value={order.address} />
        <Detail label="Time window" value={order.window} />
        <Detail label="Service time" value={order.service} />
      </DetailSection>
      <DetailSection title="Order requirements">
        <Detail
          label="Parcel load"
          value={`${order.load} · ${order.loadValue} kg`}
        />
        <Detail label="Priority" value={order.priority} />
        <Detail label="Assigned driver" value={order.driver} />
        <Detail label="Delivery date" value={order.date} />
      </DetailSection>
      <DetailSection title="Customer tracking">
        <Button onClick={share} disabled={creating}>{creating ? "Creating…" : "Get tracking link"}</Button>
        {link && <a href={link} target="_blank" rel="noreferrer">Open or copy customer tracking link</a>}
        {linkError && <p role="alert">{linkError}</p>}
      </DetailSection>
    </Drawer>
  )
}

function Detail({ label, value }: { label: string, value: string }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function NewOrderModal({
  date,
  onClose,
  onSave,
}: {
  date: string
  onClose: () => void
  onSave: (draft: OrderDraft) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (saving) return
    const fields = new FormData(e.currentTarget)
    setSaving(true)
    setError("")
    try {
      await onSave({
        customer: String(fields.get("customer")),
        address: String(fields.get("address")),
        coordinates: String(fields.get("coordinates") ?? "").trim() || null,
        date: String(fields.get("date")),
        priority: fields.get("priority") as OrderDraft["priority"],
        windowStart: String(fields.get("windowStart")),
        windowEnd: String(fields.get("windowEnd")),
        parcelCount: Number(fields.get("parcelCount")),
        loadValue: Number(fields.get("loadValue")),
        serviceMinutes: Number(fields.get("serviceMinutes")),
      })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the order.")
      setSaving(false)
    }
  }
  return (
    <Modal
      onClose={() => { if (!saving) onClose() }}
      subtitle="Add a delivery and its planning requirements."
      title="New order"
    >
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            <span>Customer name *</span>
            <input
              maxLength={120}
              name="customer"
              placeholder="e.g. Northfield Cafe"
              required
            />
          </label>
          <label>
            <span>Order ID</span>
            <input disabled value="Generated on save" />
          </label>
          <label className="span-2">
            <span>Delivery address *</span>
            <input
              maxLength={300}
              name="address"
              placeholder="Street, area, city"
              required
            />
          </label>
          <label className="span-2">
            <span>Longitude, latitude (for coordinate planning)</span>
            <input name="coordinates" />
          </label>
          <label>
            <span>Delivery date</span>
            <input defaultValue={date} name="date" required type="date" />
          </label>
          <label>
            <span>Priority</span>
            <select name="priority">
              <option>Standard</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            <span>Window starts</span>
            <input defaultValue="13:00" name="windowStart" required type="time" />
          </label>
          <label>
            <span>Window ends</span>
            <input defaultValue="14:00" name="windowEnd" required type="time" />
          </label>
          <label>
            <span>Parcel count</span>
            <input defaultValue="1" min="1" name="parcelCount" required type="number" />
          </label>
          <label>
            <span>Total weight (kg)</span>
            <input min="0.01" name="loadValue" required step="0.01" type="number" />
          </label>
          <label>
            <span>Service time</span>
            <input defaultValue="10" max="1440" min="1" name="serviceMinutes" required type="number" />
          </label>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="modal-actions">
          <Button disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={saving} type="submit" variant="primary">
            {saving ? "Saving…" : "Create order"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function OrdersPage({
  date,
  orders,
  setOrders,
  globalSearch,
  loading,
  loadError,
  onRetry,
}: {
  date: string
  orders: Order[]
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  globalSearch: string
  loading: boolean
  loadError: string
  onRetry: () => void
}) {
  const [search, setSearch] = useState(globalSearch)
  const [status, setStatus] = useState("All statuses")
  const [priority, setPriority] = useState("All priorities")
  const [filterDate, setFilterDate] = useState("")
  const [selected, setSelected] = useState<Order | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const filtered = orders.filter(
    (o) =>
      `${o.id} ${o.customer} ${o.address}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All statuses" || o.status === status) &&
      (priority === "All priorities" || o.priority === priority) &&
      (!filterDate || o.date === filterDate),
  )
  const save = async (draft: OrderDraft) => {
    const order = await createOrder(draft)
    setOrders((current) => [order, ...current])
    setSearch("")
    setStatus("All statuses")
    setPriority("All priorities")
    setFilterDate("")
    setNewOpen(false)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }
  return (
    <div className="page">
      <PageHeader
        title="Orders"
        subtitle="Manage incoming deliveries and their requirements."
        actions={
          <Button disabled={loading || Boolean(loadError)} onClick={() => setNewOpen(true)} variant="primary">
            <Icon name="plus" size={16} />
            New Order
          </Button>
        }
      />
      {loading && <p role="status">Loading orders…</p>}
      {loadError && (
        <div>
          <p role="alert">{loadError}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      )}
      {saved && (
        <div className="success-banner">
          <Icon name="check" />
          Order created and added to the unassigned queue.
        </div>
      )}
      <div className="order-counts">
        {[
          ["All orders", orders.length],
          ["Scheduled", orders.filter((o) => o.status === "Scheduled").length],
          [
            "In progress",
            orders.filter((o) => o.status === "In transit").length,
          ],
          [
            "Needs attention",
            orders.filter((o) => ["Exception", "Unassigned"].includes(o.status))
              .length,
          ],
        ].map(([label, count], i) => (
          <div className={i === 3 ? "attention" : ""} key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="filter-bar">
          <label className="search-input">
            <Icon name="search" size={17} />
            <input
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, customers, or addresses…"
              value={search}
            />
          </label>
          <select onChange={(e) => setStatus(e.target.value)} value={status}>
            <option>All statuses</option>
            <option>Delivered</option>
            <option>In transit</option>
            <option>Scheduled</option>
            <option>Unassigned</option>
            <option>Exception</option>
          </select>
          <select
            onChange={(e) => setPriority(e.target.value)}
            value={priority}
          >
            <option>All priorities</option>
            <option>High</option>
            <option>Standard</option>
            <option>Low</option>
          </select>
          <input
            aria-label="Delivery date"
            type="date"
            onChange={(event) => setFilterDate(event.target.value)}
            value={filterDate}
          />
          <span className="result-count">{filtered.length} orders</span>
        </div>
        <DataTable
          headers={[
            "Order ID",
            "Customer",
            "Delivery address",
            "Delivery window",
            "Priority",
            "Load",
            "Assigned driver",
            "Status",
            "",
          ]}
          onRow={(i) => setSelected(filtered[i])}
          rows={filtered.map((o) => [
            <strong>{o.id}</strong>,
            o.customer,
            o.address,
            o.window,
            <span className={`priority priority-${o.priority.toLowerCase()}`}>
              {o.priority}
            </span>,
            `${o.loadValue} kg`,
            o.driver,
            <Status value={o.status} />,
            <Icon name="chevron" size={15} />,
          ])}
        />
      </section>
      {selected && (
        <OrderDrawer onClose={() => setSelected(null)} order={selected} />
      )}
      {newOpen && (
        <NewOrderModal date={date} onClose={() => setNewOpen(false)} onSave={save} />
      )}
    </div>
  )
}

function AddFleetModal({
  type,
  availableDrivers,
  onClose,
  onDriver,
  onVehicle,
}: {
  type: "Drivers" | "Vehicles"
  availableDrivers: Driver[]
  onClose: () => void
  onDriver: (driver: DriverDraft) => Promise<void>
  onVehicle: (vehicle: VehicleDraft) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const isDriver = type === "Drivers"
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const fields = new FormData(event.currentTarget)
    setSaving(true)
    setError("")
    try {
      if (isDriver) {
        await onDriver({
          name: String(fields.get("name")),
          phone: String(fields.get("phone")),
          shiftStart: String(fields.get("shiftStart")),
          shiftEnd: String(fields.get("shiftEnd")),
        })
      } else {
        await onVehicle({
          registration: String(fields.get("registration")),
          type: String(fields.get("type")),
          capacity: Number(fields.get("capacity")),
          driverId: String(fields.get("driverId")) || null,
        })
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the fleet record.")
      setSaving(false)
    }
  }
  return (
    <Modal
      onClose={() => { if (!saving) onClose() }}
      subtitle={isDriver ? "Create an available driver profile." : "Add a vehicle to the operating fleet."}
      title={isDriver ? "Add driver" : "Add vehicle"}
    >
      <form className="form" onSubmit={submit}>
        <div className="form-grid">
          {isDriver ? (
            <>
              <label className="span-2">
                <span>Full name</span>
                <input maxLength={120} name="name" placeholder="Driver name" required />
              </label>
              <label className="span-2">
                <span>Phone</span>
                <input maxLength={40} name="phone" placeholder="+91 98765 00000" type="tel" />
              </label>
              <label>
                <span>Shift starts</span>
                <input defaultValue="09:00" name="shiftStart" required type="time" />
              </label>
              <label>
                <span>Shift ends</span>
                <input defaultValue="17:00" name="shiftEnd" required type="time" />
              </label>
            </>
          ) : (
            <>
              <label className="span-2">
                <span>Registration identifier</span>
                <input maxLength={24} name="registration" placeholder="e.g. HR-26-AB-1234" required />
              </label>
              <label>
                <span>Vehicle type</span>
                <select name="type">
                  <option>Delivery van</option>
                  <option>Mini truck</option>
                  <option>Mini van</option>
                </select>
              </label>
              <label>
                <span>Maximum capacity (kg)</span>
                <input defaultValue="180" min="0.01" name="capacity" required step="0.01" type="number" />
              </label>
              <label className="span-2">
                <span>Assigned driver</span>
                <select name="driverId">
                  <option value="">Unassigned</option>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>{driver.name} ({driver.id})</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="modal-actions">
          <Button disabled={saving} onClick={onClose}>Cancel</Button>
          <Button disabled={saving} type="submit" variant="primary">
            {saving ? "Saving…" : isDriver ? "Save driver" : "Save vehicle"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function FleetPage({
  drivers,
  setDrivers,
  vehicles,
  setVehicles,
  loading,
  loadError,
  onRetry,
}: {
  drivers: Driver[]
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>
  vehicles: Vehicle[]
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>
  loading: boolean
  loadError: string
  onRetry: () => void
}) {
  const [tab, setTab] = useState<"Drivers" | "Vehicles">("Drivers")
  const [selected, setSelected] = useState<Driver | Vehicle | null>(null)
  const [adding, setAdding] = useState(false)
  return (
    <div className="page">
      <PageHeader
        title="Drivers & Vehicles"
        subtitle="Manage fleet availability, capacity, and route assignments."
        actions={
          <Button disabled={loading || Boolean(loadError)} onClick={() => setAdding(true)} variant="primary">
            <Icon name="plus" size={16} />
            Add {tab === "Drivers" ? "Driver" : "Vehicle"}
          </Button>
        }
      />
      {loading && <p role="status">Loading fleet…</p>}
      {loadError && (
        <div>
          <p role="alert">{loadError}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      )}
      <div className="tabs">
        <button
          className={tab === "Drivers" ? "active" : ""}
          onClick={() => setTab("Drivers")}
        >
          Drivers <span>{drivers.length}</span>
        </button>
        <button
          className={tab === "Vehicles" ? "active" : ""}
          onClick={() => setTab("Vehicles")}
        >
          Vehicles <span>{vehicles.length}</span>
        </button>
      </div>
      <div className="fleet-summary">
        {tab === "Drivers" ? (
          <>
            <div>
              <span>On route</span>
              <strong>{drivers.filter((driver) => driver.status === "On route").length}</strong>
            </div>
            <div>
              <span>Available</span>
              <strong>
                {drivers.filter((d) => d.status === "Available").length}
              </strong>
            </div>
            <div>
              <span>Deliveries assigned</span>
              <strong>{drivers.reduce((total, driver) => total + driver.assigned, 0)}</strong>
            </div>
            <div>
              <span>Completed today</span>
              <strong>{drivers.reduce((total, driver) => total + driver.completed, 0)}</strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>In service</span>
              <strong>
                {vehicles.filter((v) => v.status === "In service").length}
              </strong>
            </div>
            <div>
              <span>Available</span>
              <strong>
                {vehicles.filter((v) => v.status === "Available").length}
              </strong>
            </div>
            <div>
              <span>Maintenance</span>
              <strong>
                {vehicles.filter((v) => v.status === "Maintenance").length}
              </strong>
            </div>
            <div>
              <span>Total capacity</span>
              <strong>{vehicles.reduce((a, v) => a + v.capacity, 0)} kg</strong>
            </div>
          </>
        )}
      </div>
      <section className="panel table-panel">
        {tab === "Drivers" ? (
          <DataTable
            headers={[
              "Driver",
              "Availability",
              "Assigned route",
              "Delivery progress",
              "Shift hours",
              "Contact",
              "",
            ]}
            onRow={(i) => setSelected(drivers[i])}
            rows={drivers.map((d) => [
              <div className="person-cell">
                <span className="avatar">{d.initials}</span>
                <strong>{d.name}</strong>
              </div>,
              <Status value={d.status} />,
              d.route,
              <div className="inline-progress">
                <span>
                  {d.completed}/{d.assigned || 0}
                </span>
                <div>
                  <i
                    style={{
                      width: `${
                        d.assigned ? (d.completed / d.assigned) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>,
              d.shift,
              <div className="contact-cell">
                <span>{d.phone}</span>
                <small>{d.email}</small>
              </div>,
              <Icon name="chevron" size={15} />,
            ])}
          />
        ) : (
          <DataTable
            headers={[
              "Vehicle",
              "Type",
              "Maximum capacity",
              "Assigned load",
              "Availability",
              "Assigned driver",
              "Operational status",
              "",
            ]}
            onRow={(i) => setSelected(vehicles[i])}
            rows={vehicles.map((v) => [
              <strong>{v.id}</strong>,
              v.type,
              `${v.capacity} kg`,
              <div className="vehicle-load">
                <span>{v.load} kg</span>
                <div>
                  <i style={{ width: `${(v.load / v.capacity) * 100}%` }} />
                </div>
              </div>,
              <Status value={v.status} />,
              v.driver,
              v.operational,
              <Icon name="chevron" size={15} />,
            ])}
          />
        )}
      </section>
      {selected && (
        <Drawer
          onClose={() => setSelected(null)}
          subtitle={"name" in selected ? selected.id : selected.type}
          title={"name" in selected ? selected.name : selected.id}
        >
          <div className="profile-hero">
            <div className="avatar large">
              {"name" in selected ? selected.initials : <Icon name="truck" />}
            </div>
            <div>
              <Status value={selected.status} />
              <p>
                {"name" in selected ? selected.route : selected.operational}
              </p>
            </div>
          </div>
          {"name" in selected ? (
            <>
              <DetailSection title="Driver assignment">
                <Detail label="Assigned route" value={selected.route} />
                <Detail
                  label="Delivery progress"
                  value={`${selected.completed} of ${selected.assigned} completed`}
                />
                <Detail label="Shift" value={selected.shift} />
              </DetailSection>
              <DetailSection title="Contact">
                <Detail label="Phone" value={selected.phone} />
                <Detail label="Email" value={selected.email} />
              </DetailSection>
            </>
          ) : (
            <>
              <DetailSection title="Vehicle capacity">
                <Detail label="Type" value={selected.type} />
                <Detail
                  label="Maximum load"
                  value={`${selected.capacity} kg`}
                />
                <Detail label="Assigned load" value={`${selected.load} kg`} />
              </DetailSection>
              <DetailSection title="Assignment">
                <Detail label="Driver" value={selected.driver} />
                <Detail
                  label="Operational status"
                  value={selected.operational}
                />
              </DetailSection>
            </>
          )}
        </Drawer>
      )}
      {adding && (
        <AddFleetModal
          availableDrivers={drivers.filter((driver) => !vehicles.some((vehicle) => vehicle.driverId === driver.id))}
          onClose={() => setAdding(false)}
          onDriver={async (draft) => {
            const driver = await createDriver(draft)
            setDrivers((current) => [...current, driver])
            setAdding(false)
          }}
          onVehicle={async (draft) => {
            const vehicle = await createVehicle(draft)
            setVehicles((current) => [...current, vehicle])
            setAdding(false)
          }}
          type={tab}
        />
      )}
    </div>
  )
}

function TrackingPage({ date, setDate, goToPlanner, onDelivered }: {
  date: string
  setDate: (date: string) => void
  goToPlanner: () => void
  onDelivered: (orderId: string, driver: string) => void
}) {
  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [vehicle, setVehicle] = useState("")
  const [loading, setLoading] = useState(Boolean(date))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [request, setRequest] = useState(0)
  const route = plan?.routes.find((item) => item.vehicleId === vehicle) ?? plan?.routes[0]
  const next = route?.stops.find((stop) => !stop.completedAt)

  useEffect(() => {
    if (!date) return
    const controller = new AbortController()
    getLatestPlan(date, controller.signal)
      .then((saved) => { if (!controller.signal.aborted) setPlan(saved) })
      .catch(() => {
        if (!controller.signal.aborted) setError("Could not load the plan. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [date, request])

  const changeDate = (nextDate: string) => {
    if (nextDate === date) return
    setPlan(null)
    setVehicle("")
    setError("")
    setLoading(Boolean(nextDate))
    setDate(nextDate)
  }

  const reload = () => {
    setLoading(true)
    setError("")
    setRequest((count) => count + 1)
  }

  const update = async (event: DeliveryUpdate) => {
    if (!plan || !route || saving || loading) return
    setSaving(true)
    setError("")
    try {
      const revised = await recordDeliveryEvent(date, plan.id, route.vehicleId, event)
      setPlan(revised)
      if (event.type === "delivered") onDelivered(event.orderId, route.driverName)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save the delivery update.")
    } finally {
      setSaving(false)
    }
  }

  let suggestedCompletion = ""
  if (next) {
    const [hours, minutes] = next.eta.split(":").map(Number)
    const finish = Math.min(1439, hours * 60 + minutes + (next.serviceMinutes ?? 0))
    suggestedCompletion = `${String(Math.floor(finish / 60)).padStart(2, "0")}:${String(finish % 60).padStart(2, "0")}`
  }

  return (
    <div className="page tracking-page">
      <PageHeader
        title="Live Tracking"
        subtitle="Record delivery updates and recalculate pending stops with the travel estimates from the saved plan."
        actions={
          <label className="date-control">
            <Icon name="calendar" size={16} />
            <input aria-label="Tracking date" disabled={saving} onChange={(event) => changeDate(event.target.value)} type="date" value={date} />
          </label>
        }
      />
      {loading && <p role="status">Loading the latest plan…</p>}
      {saving && <p role="status">Saving the delivery update…</p>}
      {error && <div><p role="alert">{error}</p><Button disabled={loading || saving} onClick={reload}>Reload plan</Button></div>}
      {!loading && !error && !plan && (
        <div>
          <p>{date ? "Create a route plan for this date to start recording deliveries." : "Choose a tracking date."}</p>
          <Button onClick={goToPlanner}>Open Route Planner</Button>
        </div>
      )}
      {plan && (
        <>
          <div className="planner-note">
            <strong>Saved plan #{plan.id}{plan.previousPlanId ? ` · Revised from #${plan.previousPlanId}` : ""}</strong>
            {plan.event && (
              <span>{plan.event.type === "delay"
                ? `${plan.event.delayMinutes}-minute delay recorded for ${plan.event.vehicleId}`
                : `${plan.event.orderId} delivered at ${plan.event.at}`}</span>
            )}
          </div>
          {plan.travelMode === "road" && <RoadAttribution />}
          {route ? (
            <section className="panel stop-panel">
              <div className="panel-head">
                <div>
                  <h2>Delivery stops</h2>
                  <p>{route.driverName} · {route.returnAt ? `Estimated depot return ${route.returnAt}` : "Depot return falls outside the shift"}</p>
                </div>
                <label>
                  Vehicle{" "}
                  <select className="select" disabled={saving || loading} value={route.vehicleId} onChange={(event) => setVehicle(event.target.value)}>
                    {plan.routes.map((item) => (
                      <option key={item.vehicleId} value={item.vehicleId}>{item.vehicleId} · {item.driverName}</option>
                    ))}
                  </select>
                </label>
              </div>
              <DataTable
                headers={["Stop", "Order", "Address", "ETA", "Delivery window", "Delivered at"]}
                rows={route.stops.map((stop, index) => [
                  index + 1, stop.orderId, stop.address, stop.eta, stop.window, stop.completedAt ?? "Pending",
                ])}
              />
              {next ? (
                <div className="tracking-actions" key={`${plan.id}-${route.vehicleId}`}>
                  <form className="form" onSubmit={(event) => {
                    event.preventDefault()
                    const fields = new FormData(event.currentTarget)
                    void update({ type: "delivered", orderId: next.orderId, at: String(fields.get("at")) })
                  }}>
                    <label>
                      <span>Completion time for {next.orderId}</span>
                      <input defaultValue={suggestedCompletion} name="at" required type="time" />
                    </label>
                    <Button disabled={saving || loading} type="submit" variant="primary">Mark next stop delivered</Button>
                  </form>
                  <form className="form" onSubmit={(event) => {
                    event.preventDefault()
                    const fields = new FormData(event.currentTarget)
                    void update({ type: "delay", minutes: Number(fields.get("minutes")) })
                  }}>
                    <label>
                      <span>Delay at the {route.stops.some((stop) => stop.completedAt) ? "last delivered stop" : "depot"} (minutes)</span>
                      <input defaultValue="15" max="720" min="1" name="minutes" required type="number" />
                    </label>
                    <Button disabled={saving || loading} type="submit">Report delay</Button>
                  </form>
                </div>
              ) : <p className="tracking-actions">No pending stops for this vehicle.</p>}
            </section>
          ) : <p>No vehicles have assigned stops on this plan.</p>}
          {plan.unassigned.length > 0 && (
            <section className="panel">
              <div className="panel-head"><div><h2>Unassigned orders ({plan.unassigned.length})</h2></div></div>
              <DataTable headers={["Order", "Address", "Reason"]} rows={plan.unassigned.map((order) => [order.orderId, order.address, order.reason])} />
            </section>
          )}
        </>
      )}
    </div>
  )
}

type ReportDate = { date: string, setDate: (date: string) => void }

function ReportDatePicker({ date, setDate }: ReportDate) {
  return (
    <label className="date-control">
      <Icon name="calendar" size={16} />
      <input aria-label="Planning date" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
    </label>
  )
}

function useDatedReport<T>(date: string, load: (date: string, signal: AbortSignal) => Promise<T>) {
  const [request, setRequest] = useState(0)
  const [result, setResult] = useState<{ date: string, data?: T, error?: string } | null>(null)

  useEffect(() => {
    if (!date) return
    const controller = new AbortController()
    load(date, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setResult({ date, data }) })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ date, error: "Could not load the report. Check that the RouteMind API is running." })
      })
    return () => controller.abort()
  }, [date, load, request])

  const current = result?.date === date ? result : null
  return {
    data: current?.data,
    error: current?.error,
    loading: Boolean(date && !current),
    retry: () => {
      setResult(null)
      setRequest((count) => count + 1)
    },
  }
}

function AnalyticsPage({ date, setDate }: ReportDate) {
  const { data, loading, error, retry } = useDatedReport(date, getAnalytics)
  return (
    <div className="page">
      <PageHeader
        title="Analytics"
        subtitle="Delivery outcomes and reported delays for the latest saved plan."
        actions={<ReportDatePicker date={date} setDate={setDate} />}
      />
      {loading && <p role="status">Loading analytics…</p>}
      {error && <div><p role="alert">{error}</p><Button onClick={retry}>Retry</Button></div>}
      {!date && <p>Choose a planning date.</p>}
      {data === null && <p>No saved plan for this date. Generate a plan to see its delivery outcomes.</p>}
      {data && (
        <>
          {data.travelMode === "road" && <RoadAttribution />}
          <div className="analytic-metrics">
            <div>
              <span>Completed</span>
              <strong>{data.completed}</strong>
              <small>Of {data.orderCount} orders in plan #{data.planId}</small>
            </div>
            <div>
              <span>Pending</span>
              <strong>{data.pending}</strong>
              <small>Still assigned to a vehicle</small>
            </div>
            <div>
              <span>Unassigned</span>
              <strong>{data.unassigned}</strong>
              <small>Orders awaiting review</small>
            </div>
            <div>
              <span>Reported delays</span>
              <strong>{data.delayCount}</strong>
              <small>{data.delayMinutes} minutes reported</small>
            </div>
          </div>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Delivery progress by vehicle</h2>
                <p>{data.distanceKm} km estimated across {data.routes.length} vehicles</p>
              </div>
            </div>
            {data.routes.length ? (
              <DataTable
                headers={["Vehicle", "Driver", "Completed", "Pending", "Est. distance", "Est. duration"]}
                rows={data.routes.map((route) => [
                  route.vehicleId, route.driverName, route.completed, route.pending,
                  `${route.distanceKm} km`, `${route.durationMinutes} min`,
                ])}
              />
            ) : <p className="report-empty">No vehicles have assigned stops.</p>}
          </section>
        </>
      )}
    </div>
  )
}

function describeRun(run: RoutePlan) {
  if (run.event?.type === "delay") return `${run.event.delayMinutes}-minute delay · ${run.event.vehicleId}`
  if (run.event?.type === "delivered") return `${run.event.orderId} delivered at ${run.event.at}`
  return "Optimization run"
}

function HistoryPage({ date, setDate }: ReportDate) {
  const { data: runs, loading, error, retry } = useDatedReport(date, listPlans)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = runs?.find((run) => run.id === selectedId)
  const previous = runs?.find((run) => run.id === selected?.previousPlanId)
  const changes = selected && previous ? comparePlans(previous, selected) : []
  const visible = runs?.filter((run) =>
    String(run.id).includes(search.trim().replace(/^#/, "")) &&
    (filter === "all" || (run.event?.type ?? "optimization") === filter),
  ) ?? []

  return (
    <div className="page">
      <PageHeader
        title="Optimization History"
        subtitle="Review saved route plans and see what changed after a delivery update."
        actions={
          <ReportDatePicker date={date} setDate={(next) => {
            setSelectedId(null)
            setDate(next)
          }} />
        }
      />
      {loading && <p role="status">Loading plan history…</p>}
      {error && <div><p role="alert">{error}</p><Button onClick={retry}>Retry</Button></div>}
      {!date && <p>Choose a planning date.</p>}
      {runs && (
        <section className="panel table-panel">
          <div className="panel-head">
            <div><h2>Saved plans</h2><p>{runs.length} saved for {date}</p></div>
            <div className="report-filters">
              <label className="search-input compact">
                <Icon name="search" size={16} />
                <input aria-label="Run ID" onChange={(event) => setSearch(event.target.value)} placeholder="Run ID" value={search} />
              </label>
              <select aria-label="Run type" className="select" onChange={(event) => setFilter(event.target.value)} value={filter}>
                <option value="all">All run types</option>
                <option value="optimization">Optimization</option>
                <option value="delivered">Delivery completed</option>
                <option value="delay">Delay reported</option>
              </select>
            </div>
          </div>
          {visible.length ? (
            <DataTable
              headers={["Run", "Saved at", "Trigger", "Vehicles", "Assigned", "Unassigned", ""]}
              rows={visible.map((run) => [
                `#${run.id}`, new Date(run.createdAt).toLocaleString(), describeRun(run), run.routes.length,
                run.orderCount - run.unassigned.length, run.unassigned.length,
                <Button ariaLabel={`View plan ${run.id}`} onClick={() => setSelectedId(run.id)}>View</Button>,
              ])}
            />
          ) : <p className="report-empty">{runs.length ? "No runs match these filters." : "No plans saved for this date."}</p>}
        </section>
      )}
      {selected && (
        <Drawer onClose={() => setSelectedId(null)} subtitle={selected.date} title={`Plan #${selected.id}`}>
          <DetailSection title="Run summary">
            <Detail label="Trigger" value={describeRun(selected)} />
            <Detail label="Method" value={selected.method} />
            <Detail label="Travel data" value={selected.travelSource} />
            <Detail label="Assigned / total" value={`${selected.orderCount - selected.unassigned.length} / ${selected.orderCount}`} />
            <Detail label="Estimated distance" value={`${selected.routes.reduce((sum, route) => sum + route.distanceKm, 0)} km`} />
          </DetailSection>
          {selected.travelMode === "road" && <RoadAttribution />}
          {selected.previousPlanId && (
            <section className="report-details">
              <h3>Changes from plan #{selected.previousPlanId}</h3>
              {changes.length ? (
                <DataTable headers={["Order", "Before", "After"]} rows={changes} />
              ) : <p>{previous ? "No changes to stop ETAs or delivery outcomes." : "The previous plan is unavailable."}</p>}
            </section>
          )}
          <section className="report-details">
            <h3>Stops in this plan</h3>
            {selected.routes.length ? (
              <DataTable
                headers={["Vehicle", "Stop", "Order", "ETA", "Delivered at"]}
                rows={selected.routes.flatMap((route) => route.stops.map((stop, index) => [
                  route.vehicleId, index + 1, stop.orderId, stop.eta, stop.completedAt ?? "—",
                ]))}
              />
            ) : <p>No assigned stops.</p>}
          </section>
          {selected.unassigned.length > 0 && (
            <section className="report-details">
              <h3>Unassigned orders</h3>
              <DataTable headers={["Order", "Reason"]} rows={selected.unassigned.map((order) => [order.orderId, order.reason])} />
            </section>
          )}
        </Drawer>
      )}
    </div>
  )
}

function pageFromHash(): Page {
  const hash = window.location.hash.replace("#/", "") as Page
  return pageTitles[hash] ? hash : "overview"
}

function CustomerTrackingPage({ token }: { token: string }) {
  const [status, setStatus] = useState<CustomerTrackingStatus | null>(null)
  const [error, setError] = useState("")
  const [request, setRequest] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    getCustomerTracking(token, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setStatus(result) })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load delivery status.")
      })
    return () => controller.abort()
  }, [token, request])

  return (
    <main className="panel customer-status">
      <PageHeader title="Delivery status" subtitle={status ? `Order ${status.orderId}` : "RouteMind"} />
      {!status && !error && <p role="status">Loading delivery status…</p>}
      {error && <p role="alert">{error}</p>}
      {status && (
        <DetailSection title={status.status}>
          <Detail label="Delivery date" value={status.date} />
          <Detail label="Delivery window" value={status.window} />
          {status.eta && <Detail label="Estimated arrival" value={status.eta} />}
          {status.completedAt && <Detail label="Delivered at" value={status.completedAt} />}
        </DetailSection>
      )}
      <Button onClick={() => {
        setError("")
        setRequest((count) => count + 1)
      }}>Refresh status</Button>
    </main>
  )
}

export default function App() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const update = () => setHash(location.hash)
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  if (hash.startsWith("#/customer/")) {
    const token = hash.slice("#/customer/".length)
    return <CustomerTrackingPage key={token} token={token} />
  }
  return <DispatcherApp />
}

function DispatcherApp() {
  const [page, setPage] = useState<Page>(pageFromHash)
  const [date, setDate] = useState(() => new Date().toLocaleDateString("sv-SE"))
  const [globalSearch, setGlobalSearch] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState("")
  const [ordersRequest, setOrdersRequest] = useState(0)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [fleetLoading, setFleetLoading] = useState(true)
  const [fleetError, setFleetError] = useState("")
  const [fleetRequest, setFleetRequest] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    listOrders(controller.signal)
      .then((records) => { if (!controller.signal.aborted) setOrders(records) })
      .catch(() => {
        if (!controller.signal.aborted) setOrdersError("Could not load orders. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setOrdersLoading(false) })
    return () => controller.abort()
  }, [ordersRequest])
  useEffect(() => {
    const controller = new AbortController()
    listFleet(controller.signal)
      .then((fleet) => {
        if (controller.signal.aborted) return
        setDrivers(fleet.drivers)
        setVehicles(fleet.vehicles)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFleetError("Could not load the fleet. Check that the RouteMind API is running.")
      })
      .finally(() => { if (!controller.signal.aborted) setFleetLoading(false) })
    return () => controller.abort()
  }, [fleetRequest])
  useEffect(() => {
    const handler = () => setPage(pageFromHash())
    window.addEventListener("hashchange", handler)
    return () => window.removeEventListener("hashchange", handler)
  }, [])
  const goTo = (next: Page) => {
    window.location.hash = `/${next}`
    setPage(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const searchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (globalSearch.trim()) goTo("orders")
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-label">{group.label}</span>
            {group.items.map((item) => (
              <button
                className={`nav-item ${page === item.page ? "active" : ""}`}
                key={item.page}
                onClick={() => goTo(item.page)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.page === "orders" && <b>{orders.length}</b>}
              </button>
            ))}
          </div>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            <span>RouteMind</span>
            <Icon name="chevron" size={13} />
            <strong>{pageTitles[page]}</strong>
          </div>
          <div className="top-actions">
            <form className="global-search" onSubmit={searchSubmit}>
              <Icon name="search" size={17} />
              <input
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search orders…"
                value={globalSearch}
              />
            </form>
          </div>
        </header>
        <div className="main-content">
          {page === "overview" && (
            <OverviewPage date={date} goTo={goTo} orders={orders} ordersLoading={ordersLoading} ordersError={ordersError} setDate={setDate} />
          )}
          {page === "planner" && <PlannerPage date={date} setDate={setDate} />}
          {page === "orders" && (
            <OrdersPage
              date={date}
              globalSearch={globalSearch}
              loadError={ordersError}
              loading={ordersLoading}
              onRetry={() => {
                setOrdersError("")
                setOrdersLoading(true)
                setOrdersRequest((request) => request + 1)
              }}
              orders={orders}
              setOrders={setOrders}
            />
          )}
          {page === "fleet" && (
            <FleetPage
              drivers={drivers}
              loadError={fleetError}
              loading={fleetLoading}
              onRetry={() => {
                setFleetError("")
                setFleetLoading(true)
                setFleetRequest((request) => request + 1)
              }}
              setDrivers={setDrivers}
              setVehicles={setVehicles}
              vehicles={vehicles}
            />
          )}
          {page === "tracking" && <TrackingPage
              date={date}
              setDate={setDate}
              goToPlanner={() => goTo("planner")}
              onDelivered={(orderId, driver) => {
                setOrders((records) => records.map((order) =>
                  order.id === orderId ? { ...order, status: "Delivered", driver } : order,
                ))
              }}
            />}
          {page === "analytics" && <AnalyticsPage date={date} setDate={setDate} />}
          {page === "history" && <HistoryPage date={date} setDate={setDate} />}
        </div>
      </main>
    </div>
  )
}
