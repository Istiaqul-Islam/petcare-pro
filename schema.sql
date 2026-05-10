-- schema.sql
-- Pet Care Management System - Final Harmonized Schema
-- Fully aligned with API JOINs and Clinical logic.

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT, 
    name TEXT,
    avatar TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'user', 
    isVerified INTEGER DEFAULT 0,
    firebaseUid TEXT UNIQUE,
    firebaseMetadata TEXT,
    showPets INTEGER DEFAULT 1,
    showEmail INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- 2. Veterinarians table
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

-- 3. Pets table (Harmonized with API expectations)
CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age TEXT, -- UI display age
    birthDate TEXT, -- API expected field
    weight TEXT,
    gender TEXT,
    color TEXT,
    photo TEXT,
    notes TEXT, -- API expected field
    medicalNotes TEXT, -- Clinical field
    bloodGroup TEXT,
    isNeutered INTEGER DEFAULT 0,
    lastCheckup TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    petId TEXT NOT NULL,
    vetId TEXT, 
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    reason TEXT,
    type TEXT DEFAULT 'consultation',
    status TEXT DEFAULT 'pending', 
    notes TEXT,
    fee REAL DEFAULT 0,
    paymentStatus TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (vetId) REFERENCES veterinarians(id) ON DELETE SET NULL
);

-- 5. Vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    petId TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    manufacturer TEXT,
    dateAdministered TEXT,
    nextDueDate TEXT,
    veterinarian TEXT,
    clinic TEXT,
    batchNumber TEXT,
    notes TEXT,
    status TEXT DEFAULT 'completed',
    reminderSent INTEGER DEFAULT 0,
    reminderDays INTEGER DEFAULT 7,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (petId) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Posts table
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    likesCount INTEGER DEFAULT 0,
    commentsCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Comments table
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

-- 8. Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    postId TEXT,
    commentId TEXT,
    userId TEXT NOT NULL,
    type TEXT DEFAULT 'heart',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (commentId) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (postId IS NOT NULL OR commentId IS NOT NULL)
);

-- 9. Feedbacks table
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

-- 10. Notifications table
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

-- 11. Receptionist to Doctor Mapping
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
