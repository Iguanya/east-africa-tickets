import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { RowDataPacket } from "mysql2";
import { execute, query, withTransaction } from "./db.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.API_PORT || process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret";

// Allow multiple dev origins if needed
app.use(
  cors({
    // Allow any origin (HTTP/HTTPS, localhost or IP) to call this API.
    // For production, you should tighten this to a specific allowlist.
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

interface AuthenticatedUser {
  id: string;
  email: string;
  is_admin: boolean;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  points: number;
  is_admin: 0 | 1;
  password_hash?: string;
  created_at: string;
  updated_at: string;
};

type EventRow = RowDataPacket & {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string;
  location: string;
  category: string;
  max_capacity: number;
  tickets_sold: number;
  status: string;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type TicketRow = RowDataPacket & {
  id: string;
  event_id: string;
  type: string;
  name: string;
  description: string | null;
  price: string | number;
  currency: string;
  quantity_available: number;
  quantity_sold: number;
  created_at: string;
  updated_at: string;
};

type BookingRow = RowDataPacket & {
  id: string;
  user_id: string | null;
  event_id: string;
  ticket_id: string;
  quantity: number;
  total_amount: string | number;
  currency: string;
  status: string;
  guest_email: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type PaymentRow = RowDataPacket & {
  id: string;
  booking_id: string;
  amount: string | number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  transaction_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const sanitizeNumber = (value: string | number | null) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function toUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    points: row.points,
    is_admin: Boolean(row.is_admin),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toTicket(row: TicketRow) {
  return {
    id: row.id,
    event_id: row.event_id,
    type: row.type,
    name: row.name,
    description: row.description,
    price: sanitizeNumber(row.price) ?? 0,
    currency: row.currency,
    quantity_available: row.quantity_available,
    quantity_sold: row.quantity_sold,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toEvent(row: EventRow, tickets: TicketRow[] = [], revenue = 0) {
  return {
    ...row,
    tickets: tickets.map(toTicket),
    revenue,
  };
}

function toUserSummary(row?: UserRow | null) {
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    is_admin: Boolean(row.is_admin),
  };
}

function toBooking(
  row: BookingRow,
  event?: Partial<EventRow>,
  ticket?: Partial<TicketRow>,
  user?: ReturnType<typeof toUserSummary>,
) {
  return {
    ...row,
    total_amount: sanitizeNumber(row.total_amount) ?? 0,
    events: event ? { ...event } : undefined,
    tickets: ticket ? { ...ticket } : undefined,
    user,
  };
}

function buildToken(user: ReturnType<typeof toUser>) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      is_admin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function authenticate(requireAdmin = false) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = header.startsWith("Bearer ") ? header.slice(7) : header;

    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        sub: string;
        email: string;
        is_admin: boolean;
      };

      if (requireAdmin && !payload.is_admin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.user = {
        id: payload.sub,
        email: payload.email,
        is_admin: payload.is_admin,
      };

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: "mysql", timestamp: new Date().toISOString() });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password, fullName, phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const existing = await query<UserRow>("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 10);

    await execute(
      `INSERT INTO users (id, email, password_hash, full_name, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [id, email, passwordHash, fullName || null, phone || null],
    );

    const [created] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
    const user = toUser(created);
    const token = buildToken(user);

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Failed to sign up" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const [userRow] = await query<UserRow>("SELECT * FROM users WHERE email = ?", [email]);
    if (!userRow || !userRow.password_hash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordValid = await bcrypt.compare(password, userRow.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = toUser(userRow);
    const token = buildToken(user);

    return res.json({ user, token });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Failed to sign in" });
  }
});

app.get("/api/auth/me", authenticate(), async (req: AuthenticatedRequest, res) => {
  try {
    const [userRow] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [req.user!.id]);
    if (!userRow) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = toUser(userRow);
    return res.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ message: "Failed to load profile" });
  }
});

app.get("/api/events", async (_req, res) => {
  try {
    const events = await fetchEvents();
    console.log("[API] /api/events ->", {
      count: events.length,
      ids: events.map((e) => e.id),
    });
    return res.json(events);
  } catch (error) {
    console.error("[API] Fetch events error:", error);
    return res.status(500).json({ message: "Failed to load events" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await fetchEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.json(event);
  } catch (error) {
    console.error("Fetch event error:", error);
    return res.status(500).json({ message: "Failed to load event" });
  }
});

app.post("/api/events", authenticate(true), async (req: AuthenticatedRequest, res) => {
  const {
    title,
    description,
    image_url,
    date,
    location,
    category,
    max_capacity,
    currency = "KSH",
    status = "active",
  } = req.body;

  if (!title || !date || !location || !category || !max_capacity) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const id = uuid();
    await execute(
      `INSERT INTO events (
        id, title, description, image_url, date, location, category, max_capacity, 
        currency, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title,
        description || null,
        image_url || null,
        new Date(date),
        location,
        category,
        Number(max_capacity),
        currency,
        status,
        req.user?.id ?? null,
      ],
    );

    const event = await fetchEventById(id);
    return res.status(201).json(event);
  } catch (error) {
    console.error("Create event error:", error);
    return res.status(500).json({ message: "Failed to create event" });
  }
});

app.put("/api/events/:id", authenticate(true), async (req, res) => {
  const eventId = req.params.id;

  try {
    const [existing] = await query<EventRow>("SELECT * FROM events WHERE id = ?", [eventId]);
    if (!existing) {
      return res.status(404).json({ message: "Event not found" });
    }

    const fields = [
      "title",
      "description",
      "image_url",
      "date",
      "location",
      "category",
      "max_capacity",
      "currency",
      "status",
    ];

    const updates: string[] = [];
    const params: unknown[] = [];

    fields.forEach((field) => {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        if (field === "date") {
          params.push(new Date(req.body[field]));
        } else if (field === "max_capacity") {
          params.push(Number(req.body[field]));
        } else {
          params.push(req.body[field]);
        }
      }
    });

    if (updates.length === 0) {
      return res.json(await fetchEventById(eventId));
    }

    await execute(
      `UPDATE events SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...params, eventId],
    );

    const event = await fetchEventById(eventId);
    return res.json(event);
  } catch (error) {
    console.error("Update event error:", error);
    return res.status(500).json({ message: "Failed to update event" });
  }
});

app.delete("/api/events/:id", authenticate(true), async (req, res) => {
  try {
    await execute("DELETE FROM events WHERE id = ?", [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error("Delete event error:", error);
    return res.status(500).json({ message: "Failed to delete event" });
  }
});

app.post("/api/tickets", authenticate(true), async (req, res) => {
  const { event_id, type = "regular", name, description, price, currency = "KSH", quantity_available } =
    req.body;

  if (!event_id || !name || !price || !quantity_available) {
    return res.status(400).json({ message: "Missing required ticket fields" });
  }

  try {
    const id = uuid();
    await execute(
      `INSERT INTO tickets (
        id, event_id, type, name, description, price, currency, quantity_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        event_id,
        type,
        name,
        description || null,
        Number(price),
        currency,
        Number(quantity_available),
      ],
    );

    const [ticketRow] = await query<TicketRow>("SELECT * FROM tickets WHERE id = ?", [id]);
    return res.status(201).json(toTicket(ticketRow));
  } catch (error) {
    console.error("Create ticket error:", error);
    return res.status(500).json({ message: "Failed to create ticket" });
  }
});

app.put("/api/tickets/:id", authenticate(true), async (req, res) => {
  try {
    const [ticket] = await query<TicketRow>("SELECT * FROM tickets WHERE id = ?", [req.params.id]);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const fields = ["type", "name", "description", "price", "currency", "quantity_available"];
    const updates: string[] = [];
    const params: unknown[] = [];

    fields.forEach((field) => {
      if (field in req.body) {
        updates.push(`${field} = ?`);
        if (field === "price") {
          params.push(Number(req.body[field]));
        } else if (field === "quantity_available") {
          params.push(Number(req.body[field]));
        } else {
          params.push(req.body[field]);
        }
      }
    });

    if (updates.length === 0) {
      return res.json(toTicket(ticket));
    }

    await execute(
      `UPDATE tickets SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...params, req.params.id],
    );

    const [updated] = await query<TicketRow>("SELECT * FROM tickets WHERE id = ?", [req.params.id]);
    return res.json(toTicket(updated));
  } catch (error) {
    console.error("Update ticket error:", error);
    return res.status(500).json({ message: "Failed to update ticket" });
  }
});

app.delete("/api/tickets/:id", authenticate(true), async (req, res) => {
  try {
    await execute("DELETE FROM tickets WHERE id = ?", [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error("Delete ticket error:", error);
    return res.status(500).json({ message: "Failed to delete ticket" });
  }
});

app.post("/api/bookings", async (req: AuthenticatedRequest, res) => {
  const {
    event_id,
    ticket_id,
    quantity,
    total_amount,
    currency,
    expires_at,
    guest_email,
    guest_name,
    guest_phone,
  } = req.body;

  if (!event_id || !ticket_id || !quantity || !total_amount || !currency || !expires_at) {
    return res.status(400).json({ message: "Missing required booking fields" });
  }

  try {
    const id = uuid();
    await execute(
      `INSERT INTO bookings (
        id, user_id, event_id, ticket_id, quantity, total_amount, currency, status,
        guest_email, guest_name, guest_phone, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        id,
        req.user?.id || null,
        event_id,
        ticket_id,
        Number(quantity),
        Number(total_amount),
        currency,
        guest_email || null,
        guest_name || null,
        guest_phone || null,
        new Date(expires_at),
      ],
    );

    const booking = await fetchBookingById(id);
    return res.status(201).json(booking);
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({ message: "Failed to create booking" });
  }
});

app.get("/api/bookings", authenticate(), async (req: AuthenticatedRequest, res) => {
  try {
    const bookings = await fetchBookingsForUser(req.user!.id);
    return res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res.status(500).json({ message: "Failed to load bookings" });
  }
});

app.get("/api/bookings/:id", async (req, res) => {
  try {
    const booking = await fetchBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.json(booking);
  } catch (error) {
    console.error("Fetch booking error:", error);
    return res.status(500).json({ message: "Failed to load booking" });
  }
});

app.post("/api/bookings/:id/confirm", authenticate(true), async (req, res) => {
  try {
    await execute("UPDATE bookings SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
      req.params.id,
    ]);
    const booking = await fetchBookingById(req.params.id);
    return res.json(booking);
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({ message: "Failed to confirm booking" });
  }
});

app.post("/api/bookings/:id/cancel", authenticate(), async (req: AuthenticatedRequest, res) => {
  try {
    const booking = await fetchBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user_id && booking.user_id !== req.user!.id && !req.user?.is_admin) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    await execute("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    const updated = await fetchBookingById(req.params.id);
    return res.json(updated);
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ message: "Failed to cancel booking" });
  }
});

app.get("/api/admin/bookings", authenticate(true), async (_req, res) => {
  try {
    const bookings = await fetchAllBookings();
    return res.json(bookings);
  } catch (error) {
    console.error("[API] Fetch admin bookings error:", error);
    return res.status(500).json({ message: "Failed to load bookings" });
  }
});

app.get("/api/admin/analytics", authenticate(true), async (_req, res) => {
  try {
    const analytics = await fetchAdminAnalytics();
    return res.json(analytics);
  } catch (error) {
    console.error("[API] Fetch admin analytics error:", error);
    return res.status(500).json({ message: "Failed to load analytics" });
  }
});

app.post("/api/payments", async (req, res) => {
  const { booking_id, amount, currency, payment_method, payment_reference, transaction_id } = req.body;

  if (!booking_id || !amount || !currency || !payment_method) {
    return res.status(400).json({ message: "Missing required payment fields" });
  }

  try {
    const payment = await withTransaction(async (connection) => {
      const [bookingRow] = await connection.execute<BookingRow[]>(
        "SELECT * FROM bookings WHERE id = ? FOR UPDATE",
        [booking_id],
      );

      if (!bookingRow || bookingRow.length === 0) {
        throw new Error("Booking not found");
      }

      const booking = bookingRow[0];

      const paymentId = uuid();
      await connection.execute(
        `INSERT INTO payments (
          id, booking_id, amount, currency, payment_method, payment_reference, transaction_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
        [
          paymentId,
          booking_id,
          Number(amount),
          currency,
          payment_method,
          payment_reference || null,
          transaction_id || null,
        ],
      );

      await connection.execute(
        `UPDATE bookings 
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [booking_id],
      );

      await connection.execute(
        `UPDATE tickets 
         SET quantity_sold = quantity_sold + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [booking.quantity, booking.ticket_id],
      );

      await connection.execute(
        `UPDATE events 
         SET tickets_sold = tickets_sold + ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [booking.quantity, booking.event_id],
      );

      const [paymentRow] = await connection.execute<PaymentRow[]>(
        "SELECT * FROM payments WHERE id = ?",
        [paymentId],
      );

      return paymentRow[0];
    });

    return res.status(201).json({
      ...payment,
      amount: sanitizeNumber(payment.amount),
    });
  } catch (error) {
    console.error("Process payment error:", error);
    return res.status(500).json({ message: "Failed to process payment" });
  }
});

app.get("/api/users/:id", authenticate(), async (req: AuthenticatedRequest, res) => {
  if (req.user!.id !== req.params.id && !req.user?.is_admin) {
    return res.status(403).json({ message: "Not authorized to view this profile" });
  }

  try {
    const [userRow] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!userRow) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(toUser(userRow));
  } catch (error) {
    console.error("Fetch user error:", error);
    return res.status(500).json({ message: "Failed to load user profile" });
  }
});

app.put("/api/users/:id", authenticate(), async (req: AuthenticatedRequest, res) => {
  if (req.user!.id !== req.params.id && !req.user?.is_admin) {
    return res.status(403).json({ message: "Not authorized to update this profile" });
  }

  const { full_name, phone } = req.body;

  try {
    await execute(
      `UPDATE users 
       SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [full_name || null, phone || null, req.params.id],
    );

    const [userRow] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!userRow) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(toUser(userRow));
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

app.post("/api/users/:id/points", authenticate(true), async (req, res) => {
  const { points = 0 } = req.body;

  try {
    await execute(
      `UPDATE users 
       SET points = points + ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [Number(points), req.params.id],
    );

    const [userRow] = await query<UserRow>("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!userRow) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(toUser(userRow));
  } catch (error) {
    console.error("Update points error:", error);
    return res.status(500).json({ message: "Failed to update points" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

async function fetchEvents(): Promise<ReturnType<typeof toEvent>[]> {
  const events = await query<EventRow>("SELECT * FROM events ORDER BY date ASC");
  if (events.length === 0) {
    return [];
  }

  const eventIds = events.map((event) => event.id);
  const eventPlaceholders = eventIds.map(() => "?").join(", ");

  const tickets = await query<TicketRow>(
    `SELECT * FROM tickets WHERE event_id IN (${eventPlaceholders}) ORDER BY price ASC`,
    eventIds,
  );

  const revenueRows = await query<{ event_id: string; revenue: string | number }>(
    `SELECT b.event_id, COALESCE(SUM(p.amount), 0) AS revenue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'success'
     GROUP BY b.event_id`,
  );

  const ticketMap = new Map<string, TicketRow[]>();
  tickets.forEach((ticket) => {
    const existing = ticketMap.get(ticket.event_id) || [];
    existing.push(ticket);
    ticketMap.set(ticket.event_id, existing);
  });

  const revenueMap = new Map<string, number>();
  revenueRows.forEach((row) => {
    revenueMap.set(row.event_id, sanitizeNumber(row.revenue) || 0);
  });

  return events.map((event) =>
    toEvent(event, ticketMap.get(event.id) || [], revenueMap.get(event.id) || 0),
  );
}

async function fetchEventById(eventId: string) {
  const [event] = await query<EventRow>("SELECT * FROM events WHERE id = ?", [eventId]);
  if (!event) {
    return null;
  }

  const tickets = await query<TicketRow>("SELECT * FROM tickets WHERE event_id = ?", [eventId]);

  const [revenueRow] = await query<{ revenue: string | number }>(
    `SELECT COALESCE(SUM(p.amount), 0) AS revenue
     FROM payments p
     INNER JOIN bookings b ON b.id = p.booking_id
     WHERE p.status = 'success' AND b.event_id = ?`,
    [eventId],
  );

  return toEvent(event, tickets, sanitizeNumber(revenueRow?.revenue) || 0);
}

async function fetchBookingsForUser(userId: string) {
  const bookings = await query<BookingRow>(
    "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
  );

  if (bookings.length === 0) {
    return [];
  }

  const eventIds = [...new Set(bookings.map((booking) => booking.event_id))];
  const ticketIds = [...new Set(bookings.map((booking) => booking.ticket_id))];

  const events = eventIds.length
    ? await query<EventRow>(
        `SELECT * FROM events WHERE id IN (${eventIds.map(() => "?").join(", ")})`,
        eventIds,
      )
    : [];

  const tickets = ticketIds.length
    ? await query<TicketRow>(
        `SELECT * FROM tickets WHERE id IN (${ticketIds.map(() => "?").join(", ")})`,
        ticketIds,
      )
    : [];

  const eventMap = new Map(events.map((event) => [event.id, event]));
  const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));

  return bookings.map((booking) =>
    toBooking(
      booking,
      eventMap.get(booking.event_id) || undefined,
      ticketMap.get(booking.ticket_id) || undefined,
    ),
  );
}

async function fetchBookingById(bookingId: string) {
  const [booking] = await query<BookingRow>("SELECT * FROM bookings WHERE id = ?", [bookingId]);
  if (!booking) {
    return null;
  }

  const [event] = await query<EventRow>("SELECT * FROM events WHERE id = ?", [booking.event_id]);
  const [ticket] = await query<TicketRow>("SELECT * FROM tickets WHERE id = ?", [booking.ticket_id]);

  return toBooking(booking, event, ticket);
}

async function fetchAllBookings() {
  const bookings = await query<BookingRow>("SELECT * FROM bookings ORDER BY created_at DESC");
  if (bookings.length === 0) {
    return [];
  }

  const eventIds = [...new Set(bookings.map((booking) => booking.event_id))];
  const ticketIds = [...new Set(bookings.map((booking) => booking.ticket_id))];
  const userIds = [...new Set(bookings.map((booking) => booking.user_id).filter((id): id is string => Boolean(id)))];

  const events = eventIds.length
    ? await query<EventRow>(`SELECT * FROM events WHERE id IN (${eventIds.map(() => "?").join(", ")})`, eventIds)
    : [];
  const tickets = ticketIds.length
    ? await query<TicketRow>(`SELECT * FROM tickets WHERE id IN (${ticketIds.map(() => "?").join(", ")})`, ticketIds)
    : [];
  const users = userIds.length
    ? await query<UserRow>(`SELECT * FROM users WHERE id IN (${userIds.map(() => "?").join(", ")})`, userIds)
    : [];

  const eventMap = new Map(events.map((event) => [event.id, event]));
  const ticketMap = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  return bookings.map((booking) =>
    toBooking(
      booking,
      eventMap.get(booking.event_id) || undefined,
      ticketMap.get(booking.ticket_id) || undefined,
      booking.user_id ? toUserSummary(userMap.get(booking.user_id)) : undefined,
    ),
  );
}

async function fetchAdminAnalytics() {
  const [eventCounts] = await query<{ total_events: number }>(`SELECT COUNT(*) AS total_events FROM events`);
  const [upcomingEvents] = await query<{ upcoming_events: number }>(
    `SELECT COUNT(*) AS upcoming_events FROM events WHERE date >= NOW()`,
  );
  const [ticketsSold] = await query<{ tickets_sold: number }>(
    `SELECT COALESCE(SUM(tickets_sold), 0) AS tickets_sold FROM events`,
  );
  const [totalRevenue] = await query<{ total_revenue: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = 'success'`,
  );
  const [bookingsToday] = await query<{ bookings_today: number }>(
    `SELECT COUNT(*) AS bookings_today FROM bookings WHERE DATE(created_at) = CURRENT_DATE`,
  );

  const topEvents = await query<{ id: string; title: string; revenue: number; tickets: number }>(
    `SELECT e.id, e.title,
            COALESCE(SUM(p.amount), 0) AS revenue,
            COALESCE(SUM(b.quantity), 0) AS tickets
     FROM events e
     LEFT JOIN bookings b ON b.event_id = e.id AND b.status IN ('confirmed', 'pending')
     LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'success'
     GROUP BY e.id, e.title
     ORDER BY revenue DESC
     LIMIT 5`,
  );

  return {
    totalEvents: Number(eventCounts?.total_events || 0),
    upcomingEvents: Number(upcomingEvents?.upcoming_events || 0),
    ticketsSold: Number(ticketsSold?.tickets_sold || 0),
    totalRevenue: Number(totalRevenue?.total_revenue || 0),
    bookingsToday: Number(bookingsToday?.bookings_today || 0),
    topEvents: topEvents.map((event) => ({
      ...event,
      revenue: Number(event.revenue || 0),
      tickets: Number(event.tickets || 0),
    })),
  };
}

