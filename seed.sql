-- seed.sql
-- Pet Care Management System - Seed Data
-- Admin password 'admin123' is hashed by the setup script

INSERT OR IGNORE INTO users (id, email, password, name, role, phone, address, createdAt, updatedAt)
VALUES ('admin', 'admin@petcare.com', '$2b$10$pXC3SpbfCkFLgj4her9pWeZwX.Mv10rFenYeJ9Fhph.x.r8u4KXKq', 'Admin', 'admin', '+8801234-567890', 'PCIU, Chattogram', datetime('now'), datetime('now'));
