CREATE DATABASE IF NOT EXISTS east_africa_tickets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE east_africa_tickets;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(32),
  points INT DEFAULT 0,
  is_admin TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  date DATETIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  max_capacity INT NOT NULL,
  tickets_sold INT DEFAULT 0,
  status ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',
  currency VARCHAR(10) DEFAULT 'KSH',
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'regular',
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KSH',
  quantity_available INT NOT NULL,
  quantity_sold INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  event_id CHAR(36) NOT NULL,
  ticket_id CHAR(36) NOT NULL,
  quantity INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'expired') DEFAULT 'pending',
  guest_email VARCHAR(255),
  guest_name VARCHAR(255),
  guest_phone VARCHAR(50),
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payment_method ENUM('visa', 'mastercard', 'mpesa', 'airtel_money', 'paypal', 'stripe', 'card', 'simulated') DEFAULT 'simulated',
  payment_reference VARCHAR(255),
  transaction_id VARCHAR(255),
  status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'success',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Demo data (users, events, tickets)
-- Safe to run multiple times thanks to INSERT IGNORE and stable IDs
-- ---------------------------------------------------------------------------

-- Demo users
INSERT IGNORE INTO users (id, email, password_hash, full_name, phone, points, is_admin)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'admin@example.com',
    '$2b$10$TPtcutsf0UKq/iILsk4mpeWk4KdP1.WqKluBV0SW0fGiFPYzsGMO2', -- Admin123!
    'Demo Admin',
    '+254700000001',
    100,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'user@example.com',
    '$2b$10$7enCpSPcVJbPuypsX559VOv6B1AdzO0Rki8IPKkG40FhylYlCLTXu', -- User123!
    'Demo User',
    '+254700000002',
    25,
    0
  );

-- Demo events
INSERT IGNORE INTO events (
  id, title, description, image_url, date, location, category,
  max_capacity, tickets_sold, status, currency, created_by
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Nairobi Summer Music Festival',
    'A full-day celebration of East African music featuring top artists from Kenya, Uganda, and Tanzania.',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=600&fit=crop',
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    'Kasarani Stadium, Nairobi, Kenya',
    'Music',
    5000,
    350,
    'active',
    'KSH',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'East Africa Tech & Innovation Summit',
    'Two days of talks, panels, and demos from leading startups and innovators across the region.',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=600&fit=crop',
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    'Kigali Convention Centre, Kigali, Rwanda',
    'Conference',
    1200,
    220,
    'active',
    'USD',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Coastal Food & Culture Expo',
    'Discover coastal cuisine, art, and culture from Kenya, Tanzania, and beyond.',
    'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?w=1200&h=600&fit=crop',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'Mombasa Waterfront, Mombasa, Kenya',
    'Food',
    800,
    95,
    'active',
    'KSH',
    '11111111-1111-1111-1111-111111111111'
  );

-- Demo tickets
INSERT IGNORE INTO tickets (
  id, event_id, type, name, description, price, currency, quantity_available, quantity_sold
)
VALUES
  -- Nairobi Music Festival
  (
    'aaaa1111-aaaa-1111-aaaa-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'regular',
    'Regular',
    'Standard admission with access to all performances.',
    2500.00,
    'KSH',
    3000,
    250
  ),
  (
    'aaaa2222-aaaa-2222-aaaa-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'vip',
    'VIP',
    'VIP seating close to the stage and access to the VIP lounge.',
    6000.00,
    'KSH',
    800,
    80
  ),
  -- Tech Summit
  (
    'bbbb1111-bbbb-1111-bbbb-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'regular',
    'Conference Pass',
    'Two-day conference pass with access to all sessions.',
    150.00,
    'USD',
    900,
    180
  ),
  (
    'bbbb2222-bbbb-2222-bbbb-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'vip',
    'VIP Pass',
    'Front-row seating, speakers dinner, and networking lounge access.',
    350.00,
    'USD',
    200,
    40
  ),
  -- Coastal Food Expo
  (
    'cccc1111-cccc-1111-cccc-111111111111',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'regular',
    'Day Pass',
    'General admission to food stalls, cultural performances, and marketplace.',
    1200.00,
    'KSH',
    600,
    80
  );

