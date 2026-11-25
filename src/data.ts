export type Order = {
  id: string
  customer: string
  address: string
  window: string
  windowStart: string
  windowEnd: string
  priority: "High" | "Standard" | "Low"
  load: string
  loadValue: number
  driver: string
  status: "Delivered" | "In transit" | "Scheduled" | "Unassigned" | "Exception"
  service: string
  serviceMinutes: number
  parcelCount: number
  date: string
}

export type Driver = {
  id: string
  name: string
  initials: string
  status: "Available" | "On route" | "Off shift"
  route: string
  assigned: number
  completed: number
  shift: string
  shiftStart: string
  shiftEnd: string
  phone: string
  email: string
  eta: string
}

export type Vehicle = {
  id: string
  type: string
  capacity: number
  load: number
  status: "In service" | "Available" | "Maintenance"
  driver: string
  driverId: string | null
  operational: string
}

export type Route = {
  id: number
  label: string
  driver: string
  vehicle: string
  stops: number
  completed: number
  duration: string
  distance: string
  capacity: number
  tone: string
  current: string
}

export const routes: Route[] = [
  {
    id: 1,
    label: "Route 01",
    driver: "Maya Sharma",
    vehicle: "Van · HR-26-AX-1842",
    stops: 7,
    completed: 2,
    duration: "2h 35m",
    distance: "18.4 km",
    capacity: 72,
    tone: "sage",
    current: "Riverside Road",
  },
  {
    id: 2,
    label: "Route 02",
    driver: "Arjun Mehta",
    vehicle: "Mini truck · PB-11-BK-2910",
    stops: 6,
    completed: 3,
    duration: "2h 10m",
    distance: "14.7 km",
    capacity: 64,
    tone: "gold",
    current: "Central Market",
  },
  {
    id: 3,
    label: "Route 03",
    driver: "Riya Kapoor",
    vehicle: "Van · PB-10-CF-4821",
    stops: 5,
    completed: 1,
    duration: "1h 55m",
    distance: "12.2 km",
    capacity: 81,
    tone: "blue",
    current: "West End",
  },
  {
    id: 4,
    label: "Route 04",
    driver: "Dev Malhotra",
    vehicle: "Mini van · PB-13-DM-1935",
    stops: 6,
    completed: 0,
    duration: "2h 20m",
    distance: "16.1 km",
    capacity: 58,
    tone: "clay",
    current: "Depot",
  },
]

export const initialOrders: Order[] = [
  {
    id: "RM-1042",
    customer: "Khurana Foods",
    address: "18 Central Market, Sector 17",
    window: "09:00–09:30 AM",
    windowStart: "09:00",
    windowEnd: "09:30",
    priority: "High",
    load: "2 parcels",
    parcelCount: 2,
    loadValue: 18,
    driver: "Maya Sharma",
    status: "Delivered",
    service: "10 min",
    serviceMinutes: 10,
    date: "2026-10-29",
  },
  {
    id: "RM-1057",
    customer: "Riverside Pharmacy",
    address: "42 Riverside Road",
    window: "09:45–10:15 AM",
    windowStart: "09:45",
    windowEnd: "10:15",
    priority: "High",
    load: "4 parcels",
    parcelCount: 4,
    loadValue: 34,
    driver: "Maya Sharma",
    status: "In transit",
    service: "12 min",
    serviceMinutes: 12,
    date: "2026-10-29",
  },
  {
    id: "RM-1063",
    customer: "West End Studio",
    address: "7 Ashok Lane, West End",
    window: "10:30–11:00 AM",
    windowStart: "10:30",
    windowEnd: "11:00",
    priority: "Standard",
    load: "1 parcel",
    parcelCount: 1,
    loadValue: 8,
    driver: "Maya Sharma",
    status: "Scheduled",
    service: "8 min",
    serviceMinutes: 8,
    date: "2026-10-29",
  },
  {
    id: "RM-1071",
    customer: "Garden House",
    address: "31 Garden Avenue",
    window: "11:15–11:45 AM",
    windowStart: "11:15",
    windowEnd: "11:45",
    priority: "Standard",
    load: "3 parcels",
    parcelCount: 3,
    loadValue: 21,
    driver: "Maya Sharma",
    status: "Scheduled",
    service: "10 min",
    serviceMinutes: 10,
    date: "2026-10-29",
  },
  {
    id: "RM-1076",
    customer: "Aster Printworks",
    address: "114 Mill Street",
    window: "09:30–10:30 AM",
    windowStart: "09:30",
    windowEnd: "10:30",
    priority: "Standard",
    load: "5 parcels",
    parcelCount: 5,
    loadValue: 47,
    driver: "Arjun Mehta",
    status: "In transit",
    service: "15 min",
    serviceMinutes: 15,
    date: "2026-10-29",
  },
  {
    id: "RM-1079",
    customer: "Northfield Cafe",
    address: "5 Northfield Square",
    window: "10:45–11:15 AM",
    windowStart: "10:45",
    windowEnd: "11:15",
    priority: "Low",
    load: "2 parcels",
    parcelCount: 2,
    loadValue: 14,
    driver: "Riya Kapoor",
    status: "Scheduled",
    service: "8 min",
    serviceMinutes: 8,
    date: "2026-10-29",
  },
  {
    id: "RM-1081",
    customer: "Mehra Textiles",
    address: "88 Lakeview Crescent",
    window: "09:00–09:20 AM",
    windowStart: "09:00",
    windowEnd: "09:20",
    priority: "High",
    load: "6 parcels",
    parcelCount: 6,
    loadValue: 52,
    driver: "Unassigned",
    status: "Exception",
    service: "15 min",
    serviceMinutes: 15,
    date: "2026-10-29",
  },
  {
    id: "RM-1084",
    customer: "Oakline Furnishings",
    address: "16 Industrial Estate",
    window: "12:00–01:00 PM",
    windowStart: "12:00",
    windowEnd: "13:00",
    priority: "Standard",
    load: "1 pallet",
    parcelCount: 1,
    loadValue: 118,
    driver: "Unassigned",
    status: "Unassigned",
    service: "20 min",
    serviceMinutes: 20,
    date: "2026-10-29",
  },
  {
    id: "RM-1090",
    customer: "Holland Medical",
    address: "55 Holland Park Road",
    window: "01:30–02:00 PM",
    windowStart: "13:30",
    windowEnd: "14:00",
    priority: "High",
    load: "3 parcels",
    parcelCount: 3,
    loadValue: 26,
    driver: "Dev Malhotra",
    status: "Scheduled",
    service: "10 min",
    serviceMinutes: 10,
    date: "2026-10-29",
  },
]

export const initialDrivers: Driver[] = [
  {
    id: "DRV-01",
    name: "Maya Sharma",
    initials: "MS",
    status: "On route",
    route: "Route 01",
    assigned: 7,
    completed: 2,
    shift: "08:00 AM–04:00 PM",
    shiftStart: "08:00",
    shiftEnd: "16:00",
    phone: "+91 98765 40218",
    email: "maya@routemind.demo",
    eta: "09:47 AM",
  },
  {
    id: "DRV-02",
    name: "Arjun Mehta",
    initials: "AM",
    status: "On route",
    route: "Route 02",
    assigned: 6,
    completed: 3,
    shift: "08:00 AM–04:00 PM",
    shiftStart: "08:00",
    shiftEnd: "16:00",
    phone: "+91 98765 11842",
    email: "arjun@routemind.demo",
    eta: "09:52 AM",
  },
  {
    id: "DRV-03",
    name: "Riya Kapoor",
    initials: "RK",
    status: "On route",
    route: "Route 03",
    assigned: 5,
    completed: 1,
    shift: "08:30 AM–04:30 PM",
    shiftStart: "08:30",
    shiftEnd: "16:30",
    phone: "+91 98765 72019",
    email: "riya@routemind.demo",
    eta: "10:05 AM",
  },
  {
    id: "DRV-04",
    name: "Dev Malhotra",
    initials: "DM",
    status: "Available",
    route: "Route 04",
    assigned: 6,
    completed: 0,
    shift: "09:00 AM–05:00 PM",
    shiftStart: "09:00",
    shiftEnd: "17:00",
    phone: "+91 98765 34071",
    email: "dev@routemind.demo",
    eta: "10:12 AM",
  },
  {
    id: "DRV-05",
    name: "Neel Joshi",
    initials: "NJ",
    status: "Available",
    route: "Not assigned",
    assigned: 0,
    completed: 0,
    shift: "10:00 AM–06:00 PM",
    shiftStart: "10:00",
    shiftEnd: "18:00",
    phone: "+91 98765 55340",
    email: "neel@routemind.demo",
    eta: "—",
  },
]

export const initialVehicles: Vehicle[] = [
  {
    id: "HR-26-AX-1842",
    type: "Delivery van",
    capacity: 180,
    load: 130,
    status: "In service",
    driver: "Maya Sharma",
    driverId: "DRV-01",
    operational: "Ready",
  },
  {
    id: "PB-11-BK-2910",
    type: "Mini truck",
    capacity: 320,
    load: 205,
    status: "In service",
    driver: "Arjun Mehta",
    driverId: "DRV-02",
    operational: "Ready",
  },
  {
    id: "PB-10-CF-4821",
    type: "Delivery van",
    capacity: 160,
    load: 130,
    status: "In service",
    driver: "Riya Kapoor",
    driverId: "DRV-03",
    operational: "Ready",
  },
  {
    id: "PB-13-DM-1935",
    type: "Mini van",
    capacity: 140,
    load: 81,
    status: "Available",
    driver: "Dev Malhotra",
    driverId: "DRV-04",
    operational: "Ready",
  },
  {
    id: "HR-29-GT-8014",
    type: "Mini truck",
    capacity: 350,
    load: 0,
    status: "Maintenance",
    driver: "Unassigned",
    driverId: null,
    operational: "Inspection due",
  },
]
