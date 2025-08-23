CREATE TABLE usersRcd (
  loginID VARCHAR(12) PRIMARY KEY,
  hashedPassword TEXT NOT NULL,
  userRole VARCHAR(8) NOT NULL CHECK (userRole IN ('Parent', 'Admin', 'Teacher', 'Dispatch')),
  userID VARCHAR(8) NOT NULL UNIQUE,
  userName VARCHAR(8) NOT NULL UNIQUE,
  userStatus VARCHAR(8) NOT NULL DEFAULT 'Active' CHECK (userStatus IN ('Active', 'Disabled')),
  lastLoginDTTM TIMESTAMP,
  lastPhoneHash TEXT,
  lastDeviceID TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_userid ON usersRcd(userID);
CREATE INDEX idx_users_role ON usersRcd(userRole);
CREATE INDEX idx_users_status ON usersRcd(userStatus);
