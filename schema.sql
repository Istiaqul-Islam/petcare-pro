-- schema.sql
-- Pet Care Management System - D1 Compatible Schema
-- Works with both Cloudflare D1 and local better-sqlite3

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- Used ONLY for Admin bypass; NULL for standard Firebase users
    name TEXT,
    avatar TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'receptionist', 'vet', 'admin'
    isVerified INTEGER DEFAULT 0,
    firebaseUid TEXT UNIQUE, -- The primary link to Firebase Auth
    firebaseMetadata TEXT,
    showPets INTEGER DEFAULT 1,
    showEmail INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    gender TEXT,
    birthDate TEXT,
    weight REAL,
    color TEXT,
    photo TEXT,
    notes TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Veterinarians table
CREATE TABLE IF NOT EXISTS veterinarians (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT,
    clinic TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    photo TEXT,
    qualification TEXT,
    experience INTEGER,
    rating REAL DEFAULT 0,
    reviewCount INTEGER DEFAULT 0,
    consultationFee REAL,
    availability TEXT,
    bio TEXT,
    latitude REAL,
    longitude REAL,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    petId TEXT NOT NULL,
    vetId TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    reason TEXT,
    type TEXT DEFAULT 'consultation',
    status TEXT DEFAULT 'pending',
    notes TEXT,
    fee REAL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (vetId) REFERENCES veterinarians(id) ON DELETE CASCADE
);

-- Vaccinations table for medical history
CREATE TABLE IF NOT EXISTS vaccinations (
    id TEXT PRIMARY KEY,
    petId TEXT NOT NULL,
    userId TEXT NOT NULL,
    vaccineName TEXT NOT NULL,
    dateAdministered TEXT NOT NULL,
    nextDueDate TEXT,
    notes TEXT,
    administeredBy TEXT, -- Doctor's name
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    petId TEXT NOT NULL,
    vetId TEXT, -- Assigned doctor
    serviceType TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    appointmentDate TEXT NOT NULL,
    appointmentTime TEXT NOT NULL,
    reason TEXT,
    notes TEXT,
    totalAmount REAL DEFAULT 0,
    paymentStatus TEXT DEFAULT 'pending', -- 'pending', 'paid'
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (petId) REFERENCES pets(id)
);

-- Pets table
CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL, -- Keep userId for compatibility
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age TEXT,
    weight TEXT,
    gender TEXT,
    color TEXT,
    photo TEXT, -- Keep photo for compatibility
    medicalNotes TEXT,
    bloodGroup TEXT,
    isNeutered INTEGER DEFAULT 0,
    lastCheckup TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    postId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    parentId TEXT,
    likesCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parentId) REFERENCES comments(id) ON DELETE CASCADE
);

-- Reactions table (replaces likes for extensibility)
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    postId TEXT,
    commentId TEXT,
    userId TEXT NOT NULL,
    type TEXT DEFAULT 'heart', -- heart, like, care, haha, wow, cry
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (postId IS NOT NULL OR commentId IS NOT NULL)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    category TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    adminResponse TEXT,
    reviewedAt TEXT,
    reviewedBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    actionUrl TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Receptionist to Doctor Mapping table
CREATE TABLE IF NOT EXISTS receptionist_doctors (
    receptionistId TEXT NOT NULL,
    vetId TEXT NOT NULL,
    assignedAt TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (receptionistId, vetId),
    FOREIGN KEY (receptionistId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vetId) REFERENCES veterinarians(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pets_userId ON pets(userId);
CREATE INDEX IF NOT EXISTS idx_appointments_userId ON appointments(userId);
CREATE INDEX IF NOT EXISTS idx_appointments_petId ON appointments(petId);
CREATE INDEX IF NOT EXISTS idx_appointments_vetId ON appointments(vetId);
CREATE INDEX IF NOT EXISTS idx_vaccinations_userId ON vaccinations(userId);
CREATE INDEX IF NOT EXISTS idx_vaccinations_petId ON vaccinations(petId);
CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts(userId);
CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
CREATE INDEX IF NOT EXISTS idx_comments_userId ON comments(userId);
CREATE INDEX IF NOT EXISTS idx_reactions_postId ON reactions(postId);
CREATE INDEX IF NOT EXISTS idx_reactions_userId ON reactions(userId);
CREATE INDEX IF NOT EXISTS idx_reactions_commentId ON reactions(commentId);
CREATE INDEX IF NOT EXISTS idx_feedbacks_userId ON feedbacks(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_receptionist_doctors_receptionistId ON receptionist_doctors(receptionistId);
CREATE INDEX IF NOT EXISTS idx_receptionist_doctors_vetId ON receptionist_doctors(vetId);
CREATE INDEX IF NOT EXISTS idx_veterinarians_location ON veterinarians(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
